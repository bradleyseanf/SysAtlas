import hashlib
import hmac
import json
import secrets
from base64 import urlsafe_b64decode, urlsafe_b64encode
from datetime import UTC, datetime, timedelta

PASSWORD_HASH_SCHEME = "pbkdf2_sha256"
PASSWORD_HASH_ITERATIONS = 600_000
PASSWORD_SALT_BYTES = 16
TOKEN_VERSION = "sysatlas.v1"


def _urlsafe_b64encode(value: bytes) -> str:
    return urlsafe_b64encode(value).decode("utf-8").rstrip("=")


def _urlsafe_b64decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return urlsafe_b64decode(f"{value}{padding}".encode("utf-8"))


def hash_password(password: str) -> str:
    salt = secrets.token_hex(PASSWORD_SALT_BYTES)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        bytes.fromhex(salt),
        PASSWORD_HASH_ITERATIONS,
    )
    return f"{PASSWORD_HASH_SCHEME}${PASSWORD_HASH_ITERATIONS}${salt}${digest.hex()}"


def verify_password(password: str, password_hash: str | None) -> bool:
    if not password_hash:
        return False

    try:
        scheme, iterations_raw, salt, expected_hash = password_hash.split("$", maxsplit=3)
    except ValueError:
        return False

    if scheme != PASSWORD_HASH_SCHEME:
        return False

    try:
        iterations = int(iterations_raw)
        salt_bytes = bytes.fromhex(salt)
        expected_hash_bytes = bytes.fromhex(expected_hash)
    except ValueError:
        return False

    candidate_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt_bytes,
        iterations,
    )
    return hmac.compare_digest(candidate_hash, expected_hash_bytes)


def create_access_token(*, subject: str, email: str, secret: str, expires_in: timedelta) -> str:
    expires_at = datetime.now(tz=UTC) + expires_in
    payload = {
        "ver": TOKEN_VERSION,
        "sub": subject,
        "email": email,
        "exp": int(expires_at.timestamp()),
    }
    payload_segment = _urlsafe_b64encode(
        json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    )
    signature = hmac.new(
        secret.encode("utf-8"),
        payload_segment.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    signature_segment = _urlsafe_b64encode(signature)
    return f"{payload_segment}.{signature_segment}"


def decode_access_token(token: str, secret: str) -> dict[str, str | int]:
    try:
        payload_segment, signature_segment = token.split(".", maxsplit=1)
    except ValueError as error:
        raise ValueError("Malformed access token.") from error

    expected_signature = hmac.new(
        secret.encode("utf-8"),
        payload_segment.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    provided_signature = _urlsafe_b64decode(signature_segment)
    if not hmac.compare_digest(expected_signature, provided_signature):
        raise ValueError("Invalid access token signature.")

    payload = json.loads(_urlsafe_b64decode(payload_segment).decode("utf-8"))
    if payload.get("ver") != TOKEN_VERSION:
        raise ValueError("Unsupported access token version.")

    expires_at = payload.get("exp")
    if not isinstance(expires_at, int) or expires_at < int(datetime.now(tz=UTC).timestamp()):
        raise ValueError("Expired access token.")

    return payload
