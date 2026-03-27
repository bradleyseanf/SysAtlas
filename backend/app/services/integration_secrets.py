from cryptography.fernet import Fernet

from app.core.config import settings


def _cipher() -> Fernet:
    return Fernet(settings.require_integration_encryption_key().encode("utf-8"))


def encrypt_config(config: dict[str, str]) -> dict[str, str]:
    cipher = _cipher()
    encrypted_config: dict[str, str] = {}
    for key, value in config.items():
        encrypted_config[key] = cipher.encrypt(value.encode("utf-8")).decode("utf-8")
    return encrypted_config


def decrypt_config(config: dict[str, str] | None) -> dict[str, str]:
    if not config:
        return {}
    cipher = _cipher()
    decrypted_config: dict[str, str] = {}
    for key, value in config.items():
        decrypted_config[key] = cipher.decrypt(value.encode("utf-8")).decode("utf-8")
    return decrypted_config
