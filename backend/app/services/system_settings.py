import secrets
from collections.abc import Callable

from cryptography.fernet import Fernet
from sqlalchemy.orm import Session

from app.models.system_setting import SystemSetting

APP_SECRET_KEY = "security.app_secret"
INTEGRATION_ENCRYPTION_KEY = "security.integration_encryption_key"


def get_setting(db: Session, key: str) -> SystemSetting | None:
    return db.get(SystemSetting, key)


def get_setting_value(db: Session, key: str) -> str | None:
    setting = get_setting(db, key)
    return setting.value if setting else None


def set_setting(db: Session, key: str, value: str, *, is_secret: bool = False) -> SystemSetting:
    setting = get_setting(db, key)
    if setting is None:
        setting = SystemSetting(key=key, value=value, is_secret=is_secret)
        db.add(setting)
    else:
        setting.value = value
        setting.is_secret = is_secret
    db.commit()
    db.refresh(setting)
    return setting


def get_or_create_setting_value(
    db: Session,
    key: str,
    *,
    generator: Callable[[], str],
    is_secret: bool = False,
) -> str:
    existing_value = get_setting_value(db, key)
    if existing_value is not None:
        return existing_value
    return set_setting(db, key, generator(), is_secret=is_secret).value


def ensure_system_secrets(db: Session) -> None:
    get_or_create_setting_value(
        db,
        APP_SECRET_KEY,
        generator=lambda: secrets.token_urlsafe(48),
        is_secret=True,
    )
    get_or_create_setting_value(
        db,
        INTEGRATION_ENCRYPTION_KEY,
        generator=lambda: Fernet.generate_key().decode("utf-8"),
        is_secret=True,
    )
