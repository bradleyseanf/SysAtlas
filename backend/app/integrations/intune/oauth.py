import base64
import hashlib
import hmac
import json
import secrets
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from html import escape
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlparse
from urllib.request import Request as UrlRequest
from urllib.request import urlopen

from fastapi import HTTPException, status
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.integrations.intune.devices import IntuneImportResult, import_managed_devices
from app.integrations.intune.manifest import definition
from app.models.integration_connection import IntegrationConnection
from app.models.user import User
from app.services.integration_secrets import decrypt_config, encrypt_config

POPUP_STATE_VERSION = "sysatlas.intune-popup.v1"
POPUP_STATE_TTL = timedelta(minutes=10)
POPUP_MESSAGE_TYPE = "sysatlas.integration.oauth"
DEFAULT_CONNECTION_NAME = "Microsoft Intune"
MICROSOFT_LOGIN_HOST = "https://login.microsoftonline.com"
GRAPH_SCOPES = (
    "openid",
    "profile",
    "offline_access",
    "https://graph.microsoft.com/DeviceManagementManagedDevices.Read.All",
)


@dataclass(frozen=True, slots=True)
class PopupState:
    user_id: str
    frontend_origin: str
    code_verifier: str


def _urlsafe_b64encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("utf-8").rstrip("=")


def _urlsafe_b64decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(f"{value}{padding}".encode("utf-8"))


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


def _decode_jwt_claims_unverified(token: str | None) -> dict[str, object]:
    if not token:
        return {}

    segments = token.split(".")
    if len(segments) < 2:
        return {}

    try:
        payload = json.loads(_urlsafe_b64decode(segments[1]).decode("utf-8"))
    except (ValueError, UnicodeDecodeError, json.JSONDecodeError):
        return {}

    return payload if isinstance(payload, dict) else {}


def _pkce_challenge(code_verifier: str) -> str:
    digest = hashlib.sha256(code_verifier.encode("utf-8")).digest()
    return _urlsafe_b64encode(digest)


def _sign_popup_state(payload: dict[str, str | int]) -> str:
    payload_segment = _urlsafe_b64encode(
        json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    )
    signature = hmac.new(
        settings.require_app_secret_key().encode("utf-8"),
        payload_segment.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    return f"{payload_segment}.{_urlsafe_b64encode(signature)}"


def _create_popup_state(*, frontend_origin: str, current_user: User) -> str:
    expires_at = datetime.now(tz=UTC) + POPUP_STATE_TTL
    payload = {
        "ver": POPUP_STATE_VERSION,
        "provider": definition.slug,
        "sub": str(current_user.id),
        "frontend_origin": frontend_origin,
        "exp": int(expires_at.timestamp()),
        "nonce": secrets.token_urlsafe(16),
        "code_verifier": secrets.token_urlsafe(64),
    }
    return _sign_popup_state(payload)


def _decode_popup_state(state_token: str) -> PopupState:
    try:
        payload_segment, signature_segment = state_token.split(".", maxsplit=1)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Microsoft Intune authorization state.",
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
            detail="Microsoft Intune authorization state could not be verified.",
        )

    try:
        payload = json.loads(_urlsafe_b64decode(payload_segment).decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError) as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Microsoft Intune authorization state is malformed.",
        ) from error

    if payload.get("ver") != POPUP_STATE_VERSION or payload.get("provider") != definition.slug:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Microsoft Intune authorization state is not valid for this integration.",
        )

    expires_at = payload.get("exp")
    frontend_origin = payload.get("frontend_origin")
    user_id = payload.get("sub")
    code_verifier = payload.get("code_verifier")
    if not isinstance(expires_at, int) or expires_at < int(datetime.now(tz=UTC).timestamp()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Microsoft Intune authorization state has expired. Start the connection again.",
        )

    if not isinstance(frontend_origin, str) or not isinstance(user_id, str) or not isinstance(code_verifier, str):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Microsoft Intune authorization state is incomplete.",
        )

    return PopupState(
        user_id=user_id,
        frontend_origin=_normalize_frontend_origin(frontend_origin),
        code_verifier=code_verifier,
    )


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
    return HTMLResponse(
        content=f"""<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Intune Connection</title>
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
      <h1>{'Intune connected' if success else 'Intune connection failed'}</h1>
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


def _request_form_encoded(url: str, payload: dict[str, str]) -> dict[str, object]:
    request = UrlRequest(
        url=url,
        data=urlencode(payload).encode("utf-8"),
        headers={
            "Accept": "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        method="POST",
    )
    try:
        with urlopen(request, timeout=20) as response:
            body = response.read().decode("utf-8")
    except HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        try:
            payload_body = json.loads(body) if body else {}
        except json.JSONDecodeError:
            payload_body = {}
        detail = payload_body.get("error_description") or payload_body.get("error") or "Microsoft rejected the request."
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(detail)) from error
    except URLError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Microsoft could not be reached.",
        ) from error

    try:
        parsed = json.loads(body)
    except json.JSONDecodeError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Microsoft returned an unreadable response.",
        ) from error

    if not isinstance(parsed, dict):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Microsoft returned an unexpected response.",
        )

    return parsed


def _coerce_string(value: object) -> str | None:
    if not isinstance(value, str):
        return None
    normalized = value.strip()
    return normalized or None


def _tenant_authority() -> str:
    return f"{MICROSOFT_LOGIN_HOST}/{settings.intune_oauth_tenant}"


def _redirect_uri() -> str:
    redirect_uri = settings.intune_redirect_uri
    if not redirect_uri:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Intune sign-in is not enabled on this SysAtlas deployment.",
        )
    return redirect_uri


def _client_id() -> str:
    client_id = settings.intune_client_id
    if not client_id:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Intune sign-in is not enabled on this SysAtlas deployment.",
        )
    return client_id


def _token_endpoint() -> str:
    return f"{_tenant_authority()}/oauth2/v2.0/token"


def _authorization_endpoint() -> str:
    return f"{_tenant_authority()}/oauth2/v2.0/authorize"


def _build_connection_label(*, token_claims: dict[str, object], existing: IntegrationConnection | None) -> str:
    if existing is not None and existing.tenant_label.strip():
        return existing.tenant_label

    preferred_username = _coerce_string(token_claims.get("preferred_username"))
    tenant_id = _coerce_string(token_claims.get("tid"))
    if preferred_username:
        return f"Intune ({preferred_username})"
    if tenant_id:
        return f"Intune ({tenant_id})"
    return DEFAULT_CONNECTION_NAME


def _exchange_authorization_code(*, code: str, code_verifier: str) -> dict[str, object]:
    payload = {
        "client_id": _client_id(),
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": _redirect_uri(),
        "code_verifier": code_verifier,
    }
    return _request_form_encoded(_token_endpoint(), payload)


def _refresh_access_token(refresh_token: str) -> dict[str, object]:
    payload = {
        "client_id": _client_id(),
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
        "redirect_uri": _redirect_uri(),
        "scope": " ".join(GRAPH_SCOPES),
    }
    return _request_form_encoded(_token_endpoint(), payload)


def _expires_at_from_token_response(token_response: dict[str, object]) -> datetime:
    raw_expires_in = token_response.get("expires_in")
    expires_in = int(raw_expires_in) if isinstance(raw_expires_in, int | str) and str(raw_expires_in).isdigit() else 3600
    return datetime.now(tz=UTC) + timedelta(seconds=expires_in)


def _build_encrypted_config(token_response: dict[str, object], existing_config: dict[str, str]) -> dict[str, str]:
    access_token = _coerce_string(token_response.get("access_token"))
    if access_token is None:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Microsoft did not return an access token.",
        )

    refresh_token = _coerce_string(token_response.get("refresh_token")) or existing_config.get("refresh_token")
    if refresh_token is None:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Microsoft did not return a refresh token. Reconnect the Intune integration.",
        )

    id_token_claims = _decode_jwt_claims_unverified(_coerce_string(token_response.get("id_token")))
    tenant_id = _coerce_string(id_token_claims.get("tid")) or existing_config.get("tenant_id") or settings.intune_oauth_tenant
    granted_scopes = _coerce_string(token_response.get("scope")) or existing_config.get("granted_scopes") or " ".join(GRAPH_SCOPES)

    return encrypt_config(
        {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "access_token_expires_at": _expires_at_from_token_response(token_response).isoformat(),
            "tenant_id": tenant_id,
            "granted_scopes": granted_scopes,
            "bootstrap_client_id": _client_id(),
        }
    )


def _parse_stored_timestamp(value: str | None) -> datetime | None:
    if not value:
        return None
    normalized = value.strip()
    if not normalized:
        return None
    if normalized.endswith("Z"):
        normalized = normalized[:-1] + "+00:00"
    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError:
        return None
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=UTC)


def _upsert_connection(*, db: Session, token_response: dict[str, object]) -> tuple[IntegrationConnection, IntuneImportResult]:
    existing = db.scalar(
        select(IntegrationConnection).where(IntegrationConnection.provider == definition.slug)
    )
    existing_config = decrypt_config(existing.encrypted_config) if existing and existing.encrypted_config else {}
    encrypted_config = _build_encrypted_config(token_response, existing_config)
    decrypted_config = decrypt_config(encrypted_config)
    id_token_claims = _decode_jwt_claims_unverified(_coerce_string(token_response.get("id_token")))

    connection = existing or IntegrationConnection(
        provider=definition.slug,
        tenant_label=DEFAULT_CONNECTION_NAME,
        auth_strategy=definition.auth_strategy,
        status="connected",
        scopes=list(GRAPH_SCOPES),
        encrypted_config={},
    )
    connection.tenant_label = _build_connection_label(token_claims=id_token_claims, existing=existing)
    connection.auth_strategy = definition.auth_strategy
    connection.status = "connected"
    connection.scopes = list(GRAPH_SCOPES)
    connection.encrypted_config = encrypted_config

    if existing is None:
        db.add(connection)

    db.flush()
    import_result = import_managed_devices(
        db=db,
        access_token=decrypted_config["access_token"],
        access_token_expires_at=_parse_stored_timestamp(decrypted_config.get("access_token_expires_at")) or datetime.now(tz=UTC),
    )
    db.refresh(connection)
    return connection, import_result


def import_devices_from_connection(*, db: Session) -> IntuneImportResult:
    connection = db.scalar(
        select(IntegrationConnection).where(IntegrationConnection.provider == definition.slug)
    )
    if connection is None or not connection.encrypted_config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Intune is not connected yet.",
        )

    decrypted_config = decrypt_config(connection.encrypted_config)
    refresh_token = decrypted_config.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Intune needs to be reconnected before devices can be imported again.",
        )

    token_response = _refresh_access_token(refresh_token)
    connection.encrypted_config = _build_encrypted_config(token_response, decrypted_config)
    db.flush()
    refreshed_config = decrypt_config(connection.encrypted_config)
    import_result = import_managed_devices(
        db=db,
        access_token=refreshed_config["access_token"],
        access_token_expires_at=_parse_stored_timestamp(refreshed_config.get("access_token_expires_at")) or datetime.now(tz=UTC),
    )
    db.refresh(connection)
    return import_result


def begin_oauth_flow(*, frontend_origin: str, current_user: User) -> HTMLResponse | RedirectResponse:
    normalized_frontend_origin = _normalize_frontend_origin(frontend_origin)
    try:
        state = _create_popup_state(frontend_origin=normalized_frontend_origin, current_user=current_user)
        code_verifier = _decode_popup_state(state).code_verifier
    except HTTPException as error:
        return _popup_result(
            frontend_origin=normalized_frontend_origin,
            success=False,
            message=error.detail,
        )

    authorization_url = (
        f"{_authorization_endpoint()}?"
        f"{urlencode({'client_id': _client_id(), 'response_type': 'code', 'redirect_uri': _redirect_uri(), 'response_mode': 'query', 'scope': ' '.join(GRAPH_SCOPES), 'state': state, 'prompt': 'select_account', 'code_challenge': _pkce_challenge(code_verifier), 'code_challenge_method': 'S256'})}"
    )
    return RedirectResponse(url=authorization_url, status_code=status.HTTP_302_FOUND)


def complete_oauth_flow(
    *,
    db: Session,
    state: str,
    code: str | None,
    error: str | None,
    error_description: str | None,
) -> HTMLResponse:
    popup_state = _decode_popup_state(state)
    try:
        popup_user_id = uuid.UUID(popup_state.user_id)
    except ValueError:
        return _popup_result(
            frontend_origin=popup_state.frontend_origin,
            success=False,
            message="Microsoft authorization could not be matched to a valid SysAtlas user.",
        )

    popup_user = db.get(User, popup_user_id)
    if popup_user is None or not popup_user.is_active:
        return _popup_result(
            frontend_origin=popup_state.frontend_origin,
            success=False,
            message="The SysAtlas session for this Intune authorization is no longer valid.",
        )

    if error:
        message = error_description or error.replace("_", " ")
        return _popup_result(
            frontend_origin=popup_state.frontend_origin,
            success=False,
            message=f"Microsoft authorization was not completed: {message}.",
        )

    if not code:
        return _popup_result(
            frontend_origin=popup_state.frontend_origin,
            success=False,
            message="Microsoft did not return an authorization code.",
        )

    try:
        token_response = _exchange_authorization_code(code=code, code_verifier=popup_state.code_verifier)
        _, import_result = _upsert_connection(db=db, token_response=token_response)
    except HTTPException as error_response:
        db.rollback()
        return _popup_result(
            frontend_origin=popup_state.frontend_origin,
            success=False,
            message=error_response.detail,
        )

    return _popup_result(
        frontend_origin=popup_state.frontend_origin,
        success=True,
        message=f"Intune is connected and {import_result.imported_count + import_result.updated_count} devices were imported into SysAtlas.",
    )
