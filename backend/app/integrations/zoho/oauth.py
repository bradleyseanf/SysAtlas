import hashlib
import hmac
import json
import secrets
import uuid
from base64 import urlsafe_b64decode, urlsafe_b64encode
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from html import escape
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlparse
from urllib.request import Request as UrlRequest
from urllib.request import urlopen

from fastapi import HTTPException, Request, status
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.integrations.zoho.manifest import definition
from app.models.integration_connection import IntegrationConnection
from app.models.system_setting import SystemSetting
from app.models.user import User
from app.schemas.integrations import IntegrationOauthConfigResponse, IntegrationOauthConfigUpsertRequest
from app.services.integration_secrets import decrypt_config, encrypt_config

POPUP_STATE_VERSION = "sysatlas.zoho-popup.v1"
POPUP_STATE_TTL = timedelta(minutes=10)
DEFAULT_CONNECTION_NAME = "Zoho One Workspace"
POPUP_MESSAGE_TYPE = "sysatlas.integration.oauth"
ZOHO_CLIENT_ID_SETTING_KEY = "integrations.zoho.oauth.client_id"
ZOHO_CLIENT_SECRET_SETTING_KEY = "integrations.zoho.oauth.client_secret"
ZOHO_REDIRECT_URI_SETTING_KEY = "integrations.zoho.oauth.redirect_uri"


@dataclass(frozen=True, slots=True)
class PopupState:
    provider: str
    user_id: str
    frontend_origin: str


def _urlsafe_b64encode(value: bytes) -> str:
    return urlsafe_b64encode(value).decode("utf-8").rstrip("=")


def _urlsafe_b64decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return urlsafe_b64decode(f"{value}{padding}".encode("utf-8"))


def _normalize_frontend_origin(frontend_origin: str) -> str:
    normalized = frontend_origin.strip().rstrip("/")
    parsed = urlparse(normalized)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc or parsed.params or parsed.query or parsed.fragment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid frontend origin is required to start the integration flow.",
        )

    path = parsed.path.rstrip("/")
    if path:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Frontend origin must not include a path.",
        )

    if normalized not in settings.cors_origins:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The frontend origin is not allowed for this environment.",
        )

    return normalized


def _sign_popup_state(payload: dict[str, str | int]) -> str:
    payload_segment = _urlsafe_b64encode(
        json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    )
    signature = hmac.new(
        settings.require_app_secret_key().encode("utf-8"),
        payload_segment.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    signature_segment = _urlsafe_b64encode(signature)
    return f"{payload_segment}.{signature_segment}"


def _create_popup_state(*, frontend_origin: str, current_user: User) -> str:
    expires_at = datetime.now(tz=UTC) + POPUP_STATE_TTL
    payload = {
        "ver": POPUP_STATE_VERSION,
        "provider": definition.slug,
        "sub": str(current_user.id),
        "frontend_origin": frontend_origin,
        "exp": int(expires_at.timestamp()),
        "nonce": secrets.token_urlsafe(16),
    }
    return _sign_popup_state(payload)


def _decode_popup_state(state_token: str) -> PopupState:
    try:
        payload_segment, signature_segment = state_token.split(".", maxsplit=1)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Zoho One authorization state.",
        ) from error

    expected_signature = hmac.new(
        settings.require_app_secret_key().encode("utf-8"),
        payload_segment.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    provided_signature = _urlsafe_b64decode(signature_segment)
    if not hmac.compare_digest(expected_signature, provided_signature):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Zoho One authorization state could not be verified.",
        )

    try:
        payload = json.loads(_urlsafe_b64decode(payload_segment).decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError) as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Zoho One authorization state is malformed.",
        ) from error

    if payload.get("ver") != POPUP_STATE_VERSION or payload.get("provider") != definition.slug:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Zoho One authorization state is not valid for this integration.",
        )

    expires_at = payload.get("exp")
    frontend_origin = payload.get("frontend_origin")
    user_id = payload.get("sub")
    if not isinstance(expires_at, int) or expires_at < int(datetime.now(tz=UTC).timestamp()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Zoho One authorization state has expired. Start the connection again.",
        )

    if not isinstance(frontend_origin, str) or not isinstance(user_id, str):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Zoho One authorization state is incomplete.",
        )

    return PopupState(
        provider=definition.slug,
        user_id=user_id,
        frontend_origin=_normalize_frontend_origin(frontend_origin),
    )


def _stored_redirect_uri(db: Session) -> str | None:
    redirect_uri_setting = db.get(SystemSetting, ZOHO_REDIRECT_URI_SETTING_KEY)
    if redirect_uri_setting is None:
        return None

    normalized = redirect_uri_setting.value.strip()
    return normalized or None


def _resolve_redirect_uri(*, db: Session, request: Request) -> str:
    if settings.zoho_redirect_uri:
        return settings.zoho_redirect_uri

    stored_redirect_uri = _stored_redirect_uri(db)
    if stored_redirect_uri:
        return stored_redirect_uri

    return str(request.url_for("complete_provider_oauth", provider=definition.slug))


def _zoho_scopes_value() -> str:
    scopes = settings.zoho_oauth_scopes
    if not scopes:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Zoho One scopes are not configured.",
        )
    return ",".join(scopes)


def _decrypt_secret_value(value: str) -> str:
    decrypted = decrypt_config({"value": value}).get("value")
    if not decrypted:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Stored Zoho One credentials could not be read.",
        )
    return decrypted


def _mask_client_id(client_id: str) -> str:
    if len(client_id) <= 8:
        return client_id
    return f"{client_id[:4]}...{client_id[-4:]}"


def _database_oauth_credentials(db: Session) -> tuple[str, str] | None:
    client_id_setting = db.get(SystemSetting, ZOHO_CLIENT_ID_SETTING_KEY)
    client_secret_setting = db.get(SystemSetting, ZOHO_CLIENT_SECRET_SETTING_KEY)
    if client_id_setting is None or client_secret_setting is None:
        return None

    return _decrypt_secret_value(client_id_setting.value), _decrypt_secret_value(client_secret_setting.value)


def _resolve_zoho_oauth_credentials(db: Session) -> tuple[str, str, str]:
    environment_client_id = settings.zoho_client_id
    environment_client_secret = settings.zoho_client_secret.get_secret_value() if settings.zoho_client_secret is not None else None
    if environment_client_id and environment_client_secret:
        return environment_client_id, environment_client_secret, "environment"

    database_credentials = _database_oauth_credentials(db)
    if database_credentials is not None:
        client_id, client_secret = database_credentials
        return client_id, client_secret, "database"

    if environment_client_id or environment_client_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Zoho One is not fully enabled on this SysAtlas deployment.",
        )

    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="Zoho One is not enabled on this SysAtlas deployment.",
    )


def get_oauth_config(*, db: Session, request: Request) -> IntegrationOauthConfigResponse:
    redirect_uri = _resolve_redirect_uri(db=db, request=request)
    try:
        client_id, _, source = _resolve_zoho_oauth_credentials(db)
    except HTTPException as error:
        if error.status_code != status.HTTP_503_SERVICE_UNAVAILABLE:
            raise
        return IntegrationOauthConfigResponse(
            provider=definition.slug,
            configured=False,
            source="missing",
            redirect_uri=redirect_uri,
            client_id_hint=None,
        )

    return IntegrationOauthConfigResponse(
        provider=definition.slug,
        configured=True,
        source=source,  # type: ignore[arg-type]
        redirect_uri=redirect_uri,
        client_id_hint=_mask_client_id(client_id),
    )


def save_oauth_config(*, db: Session, payload: IntegrationOauthConfigUpsertRequest) -> IntegrationOauthConfigResponse:
    encrypted_values = encrypt_config(
        {
            "client_id": payload.client_id,
            "client_secret": payload.client_secret,
        }
    )

    client_id_setting = db.get(SystemSetting, ZOHO_CLIENT_ID_SETTING_KEY)
    if client_id_setting is None:
        client_id_setting = SystemSetting(
            key=ZOHO_CLIENT_ID_SETTING_KEY,
            value=encrypted_values["client_id"],
            is_secret=True,
        )
        db.add(client_id_setting)
    else:
        client_id_setting.value = encrypted_values["client_id"]
        client_id_setting.is_secret = True

    client_secret_setting = db.get(SystemSetting, ZOHO_CLIENT_SECRET_SETTING_KEY)
    if client_secret_setting is None:
        client_secret_setting = SystemSetting(
            key=ZOHO_CLIENT_SECRET_SETTING_KEY,
            value=encrypted_values["client_secret"],
            is_secret=True,
        )
        db.add(client_secret_setting)
    else:
        client_secret_setting.value = encrypted_values["client_secret"]
        client_secret_setting.is_secret = True

    redirect_uri_setting = db.get(SystemSetting, ZOHO_REDIRECT_URI_SETTING_KEY)
    if redirect_uri_setting is None:
        redirect_uri_setting = SystemSetting(
            key=ZOHO_REDIRECT_URI_SETTING_KEY,
            value=payload.redirect_uri,
            is_secret=False,
        )
        db.add(redirect_uri_setting)
    else:
        redirect_uri_setting.value = payload.redirect_uri
        redirect_uri_setting.is_secret = False

    db.commit()
    return IntegrationOauthConfigResponse(
        provider=definition.slug,
        configured=True,
        source="database",
        redirect_uri=payload.redirect_uri,
        client_id_hint=_mask_client_id(payload.client_id),
    )


def _parse_json_response(response_body: str) -> dict[str, object]:
    try:
        payload = json.loads(response_body)
    except json.JSONDecodeError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Zoho One returned an unreadable response.",
        ) from error

    if not isinstance(payload, dict):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Zoho One returned an unexpected response.",
        )

    return payload


def _request_zoho_json(*, url: str, data: dict[str, str] | None = None, headers: dict[str, str] | None = None) -> dict[str, object]:
    encoded_data = urlencode(data).encode("utf-8") if data is not None else None
    request_headers = {"Accept": "application/json", **(headers or {})}
    if encoded_data is not None:
        request_headers.setdefault("Content-Type", "application/x-www-form-urlencoded")

    request = UrlRequest(url=url, data=encoded_data, headers=request_headers, method="POST" if encoded_data is not None else "GET")
    try:
        with urlopen(request, timeout=15) as response:
            body = response.read().decode("utf-8")
    except HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        payload = _parse_json_response(body) if body else {}
        detail = payload.get("error_description") or payload.get("error") or "Zoho One rejected the request."
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(detail),
        ) from error
    except URLError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Zoho One could not be reached.",
        ) from error

    return _parse_json_response(body)


def _exchange_authorization_code(*, db: Session, code: str, redirect_uri: str, accounts_server: str) -> dict[str, object]:
    client_id, client_secret, _ = _resolve_zoho_oauth_credentials(db)
    return _request_zoho_json(
        url=f"{accounts_server.rstrip('/')}/oauth/v2/token",
        data={
            "client_id": client_id,
            "client_secret": client_secret,
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
        },
    )


def _coerce_string(value: object) -> str | None:
    if not isinstance(value, str):
        return None
    normalized = value.strip()
    return normalized or None


def _build_connection_label(*, existing: IntegrationConnection | None) -> str:
    if existing is not None and existing.tenant_label.strip():
        return existing.tenant_label

    return DEFAULT_CONNECTION_NAME


def _build_encrypted_config(
    *,
    token_response: dict[str, object],
    existing_config: dict[str, str],
    accounts_server: str,
) -> dict[str, str]:
    access_token = _coerce_string(token_response.get("access_token"))
    if access_token is None:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Zoho One did not return an access token.",
        )

    refresh_token = _coerce_string(token_response.get("refresh_token")) or existing_config.get("refresh_token")
    if refresh_token is None:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Zoho One did not return a refresh token. Reconnect and approve offline access again.",
        )

    expires_in_raw = token_response.get("expires_in")
    expires_in_seconds = int(expires_in_raw) if isinstance(expires_in_raw, int | str) and str(expires_in_raw).isdigit() else 3600
    expires_at = datetime.now(tz=UTC) + timedelta(seconds=expires_in_seconds)

    encrypted_payload = {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "api_domain": _coerce_string(token_response.get("api_domain")) or existing_config.get("api_domain") or "",
        "token_type": _coerce_string(token_response.get("token_type")) or "Bearer",
        "accounts_server": accounts_server,
        "access_token_expires_at": expires_at.isoformat(),
        "granted_scopes": _coerce_string(token_response.get("scope")) or ",".join(settings.zoho_oauth_scopes),
    }

    return encrypt_config(encrypted_payload)


def _upsert_connection(
    *,
    db: Session,
    token_response: dict[str, object],
    accounts_server: str,
) -> None:
    existing = db.scalar(
        select(IntegrationConnection).where(IntegrationConnection.provider == definition.slug)
    )
    existing_config = decrypt_config(existing.encrypted_config) if existing and existing.encrypted_config else {}

    connection = existing or IntegrationConnection(
        provider=definition.slug,
        tenant_label=DEFAULT_CONNECTION_NAME,
        auth_strategy=definition.auth_strategy,
        status="connected",
        scopes=settings.zoho_oauth_scopes,
        encrypted_config={},
    )

    connection.tenant_label = _build_connection_label(existing=existing)
    connection.auth_strategy = definition.auth_strategy
    connection.status = "connected"
    connection.scopes = settings.zoho_oauth_scopes
    connection.encrypted_config = _build_encrypted_config(
        token_response=token_response,
        existing_config=existing_config,
        accounts_server=accounts_server,
    )

    if existing is None:
        db.add(connection)

    db.commit()


def _popup_result(*, frontend_origin: str, success: bool, message: str) -> HTMLResponse:
    safe_message = escape(message, quote=False)
    payload_json = json.dumps(
        {
            "type": POPUP_MESSAGE_TYPE,
            "provider": definition.slug,
            "success": success,
            "message": message,
        }
    )
    target_origin_json = json.dumps(frontend_origin)
    response = HTMLResponse(
        content=f"""<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Zoho One Connection</title>
    <style>
      :root {{
        color-scheme: light;
        font-family: "IBM Plex Sans", system-ui, sans-serif;
      }}
      body {{
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #f3f4f7;
        color: #1f2933;
      }}
      main {{
        width: min(30rem, calc(100vw - 2rem));
        padding: 2rem;
        border-radius: 1rem;
        background: #ffffff;
        box-shadow: 0 20px 48px rgba(15, 23, 42, 0.14);
        text-align: center;
      }}
      h1 {{
        margin: 0 0 0.75rem;
        font-size: 1.25rem;
      }}
      p {{
        margin: 0;
        line-height: 1.5;
      }}
    </style>
  </head>
  <body>
    <main>
      <h1>{'Zoho One connected' if success else 'Zoho One connection failed'}</h1>
      <p>{safe_message}</p>
    </main>
    <script>
      const payload = {payload_json};
      const targetOrigin = {target_origin_json};
      if (window.opener && !window.opener.closed) {{
        window.opener.postMessage(payload, targetOrigin);
        window.setTimeout(() => window.close(), 150);
      }}
    </script>
  </body>
</html>""",
        headers={"Cache-Control": "no-store"},
    )
    return response


def begin_oauth_flow(*, db: Session, request: Request, frontend_origin: str, current_user: User) -> HTMLResponse | RedirectResponse:
    normalized_frontend_origin = _normalize_frontend_origin(frontend_origin)
    try:
        client_id, _, _ = _resolve_zoho_oauth_credentials(db)
    except HTTPException as error:
        return _popup_result(
            frontend_origin=normalized_frontend_origin,
            success=False,
            message=error.detail,
        )
    authorization_url = (
        f"{settings.zoho_accounts_server}/oauth/v2/auth?"
        f"{urlencode({'scope': _zoho_scopes_value(), 'client_id': client_id, 'response_type': 'code', 'access_type': 'offline', 'prompt': 'consent', 'redirect_uri': _resolve_redirect_uri(db=db, request=request), 'state': _create_popup_state(frontend_origin=normalized_frontend_origin, current_user=current_user)})}"
    )
    return RedirectResponse(url=authorization_url, status_code=status.HTTP_302_FOUND)


def complete_oauth_flow(
    *,
    request: Request,
    db: Session,
    state: str,
    code: str | None,
    error: str | None,
    error_description: str | None,
    accounts_server: str | None,
) -> HTMLResponse:
    popup_state = _decode_popup_state(state)
    try:
        popup_user_id = uuid.UUID(popup_state.user_id)
    except ValueError:
        return _popup_result(
            frontend_origin=popup_state.frontend_origin,
            success=False,
            message="Zoho One authorization could not be matched to a valid SysAtlas user.",
        )

    popup_user = db.get(User, popup_user_id)
    if popup_user is None or not popup_user.is_active:
        return _popup_result(
            frontend_origin=popup_state.frontend_origin,
            success=False,
            message="The SysAtlas session for this Zoho One authorization is no longer valid.",
        )

    if error:
        message = error_description or error.replace("_", " ")
        return _popup_result(
            frontend_origin=popup_state.frontend_origin,
            success=False,
            message=f"Zoho One authorization was not completed: {message}.",
        )

    if not code:
        return _popup_result(
            frontend_origin=popup_state.frontend_origin,
            success=False,
            message="Zoho One did not return an authorization code.",
        )

    resolved_accounts_server = (accounts_server or settings.zoho_accounts_server).strip().rstrip("/")

    try:
        token_response = _exchange_authorization_code(
            db=db,
            code=code,
            redirect_uri=_resolve_redirect_uri(db=db, request=request),
            accounts_server=resolved_accounts_server,
        )
        _upsert_connection(
            db=db,
            token_response=token_response,
            accounts_server=resolved_accounts_server,
        )
    except HTTPException as error_response:
        return _popup_result(
            frontend_origin=popup_state.frontend_origin,
            success=False,
            message=error_response.detail,
        )

    return _popup_result(
        frontend_origin=popup_state.frontend_origin,
        success=True,
        message="Zoho One credentials were saved securely in SysAtlas.",
    )
