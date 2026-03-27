from cryptography.fernet import Fernet

from app.services.system_settings import INTEGRATION_ENCRYPTION_KEY
from app.services.system_settings import get_or_create_setting_value


def _cipher(db) -> Fernet:
    key = get_or_create_setting_value(
        db,
        INTEGRATION_ENCRYPTION_KEY,
        generator=lambda: Fernet.generate_key().decode("utf-8"),
        is_secret=True,
    )
    return Fernet(key.encode("utf-8"))


def encrypt_config(db, config: dict[str, str]) -> dict[str, str]:
    cipher = _cipher(db)
    encrypted_config: dict[str, str] = {}
    for key, value in config.items():
        encrypted_config[key] = cipher.encrypt(value.encode("utf-8")).decode("utf-8")
    return encrypted_config


def decrypt_config(db, config: dict[str, str] | None) -> dict[str, str]:
    if not config:
        return {}
    cipher = _cipher(db)
    decrypted_config: dict[str, str] = {}
    for key, value in config.items():
        decrypted_config[key] = cipher.decrypt(value.encode("utf-8")).decode("utf-8")
    return decrypted_config
