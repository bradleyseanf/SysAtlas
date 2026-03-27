from cryptography.fernet import Fernet, InvalidToken
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.integration_connection import IntegrationConnection
from app.models.system_setting import SystemSetting

LEGACY_APP_SECRET_KEY = "security.app_secret"
LEGACY_INTEGRATION_ENCRYPTION_KEY = "security.integration_encryption_key"


def get_setting(db: Session, key: str) -> SystemSetting | None:
    return db.get(SystemSetting, key)


def get_setting_value(db: Session, key: str) -> str | None:
    setting = get_setting(db, key)
    return setting.value if setting else None


def delete_setting(db: Session, key: str) -> bool:
    setting = get_setting(db, key)
    if setting is None:
        return False

    db.delete(setting)
    return True


def _reencrypt_config_values(config: dict[str, str], source_key: str, destination_key: str) -> dict[str, str]:
    source_cipher = Fernet(source_key.encode("utf-8"))
    destination_cipher = Fernet(destination_key.encode("utf-8"))
    migrated: dict[str, str] = {}

    for key, value in config.items():
        try:
            plaintext = source_cipher.decrypt(value.encode("utf-8"))
        except InvalidToken as error:
            raise RuntimeError("Stored integration secrets could not be decrypted with the legacy key.") from error
        migrated[key] = destination_cipher.encrypt(plaintext).decode("utf-8")

    return migrated


def migrate_legacy_system_secrets(db: Session) -> None:
    legacy_app_secret = get_setting_value(db, LEGACY_APP_SECRET_KEY)
    legacy_integration_key = get_setting_value(db, LEGACY_INTEGRATION_ENCRYPTION_KEY)
    changed = False

    if legacy_integration_key is not None:
        active_key = settings.require_integration_encryption_key()
        if legacy_integration_key != active_key:
            connections = db.scalars(
                select(IntegrationConnection).where(IntegrationConnection.encrypted_config.is_not(None))
            ).all()
            for connection in connections:
                if connection.encrypted_config:
                    connection.encrypted_config = _reencrypt_config_values(
                        connection.encrypted_config,
                        source_key=legacy_integration_key,
                        destination_key=active_key,
                    )
                    changed = True

        changed = delete_setting(db, LEGACY_INTEGRATION_ENCRYPTION_KEY) or changed

    if legacy_app_secret is not None:
        changed = delete_setting(db, LEGACY_APP_SECRET_KEY) or changed

    if changed:
        db.commit()
