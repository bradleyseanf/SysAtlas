import json
import os
import secrets
from functools import lru_cache
from pathlib import Path
from typing import Literal

from cryptography.fernet import Fernet
from pydantic import Field, SecretStr, computed_field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_SQLITE_PATH = Path(__file__).resolve().parents[2] / "sysatlas-dev.db"
LOCAL_ENVIRONMENTS = {"development", "local", "test"}


def _default_state_dir() -> Path:
    local_app_data = os.getenv("LOCALAPPDATA")
    if local_app_data:
        return Path(local_app_data) / "SysAtlas"

    return Path.home() / ".sysatlas"


def _load_or_create_local_secrets(secret_file: Path) -> dict[str, str]:
    if secret_file.exists():
        payload = json.loads(secret_file.read_text(encoding="utf-8"))
        app_secret_key = payload.get("app_secret_key")
        integration_encryption_key = payload.get("integration_encryption_key")
        if isinstance(app_secret_key, str) and isinstance(integration_encryption_key, str):
            return {
                "app_secret_key": app_secret_key,
                "integration_encryption_key": integration_encryption_key,
            }
        raise ValueError(f"Local secret store at '{secret_file}' is missing required keys.")

    secret_file.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "app_secret_key": secrets.token_urlsafe(48),
        "integration_encryption_key": Fernet.generate_key().decode("utf-8"),
    }
    secret_file.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return payload


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        case_sensitive=False,
        extra="ignore",
    )

    project_name: str = "SysAtlas"
    environment: str = "development"
    api_v1_prefix: str = "/api/v1"
    database_url: str = f"sqlite+pysqlite:///{DEFAULT_SQLITE_PATH}"
    app_secret_key: SecretStr | None = Field(default=None, validation_alias="APP_SECRET_KEY")
    integration_encryption_key: SecretStr | None = Field(default=None, validation_alias="INTEGRATION_ENCRYPTION_KEY")
    cors_origins_raw: str = Field(
        default="http://localhost:3000,http://localhost:5173",
        validation_alias="CORS_ORIGINS",
    )
    state_dir: Path = Field(default_factory=_default_state_dir, validation_alias="SYSATLAS_STATE_DIR")
    session_cookie_name: str = Field(default="sysatlas_session", validation_alias="SESSION_COOKIE_NAME")
    session_cookie_samesite: Literal["lax", "strict", "none"] = Field(
        default="lax",
        validation_alias="SESSION_COOKIE_SAMESITE",
    )
    session_cookie_domain: str | None = Field(default=None, validation_alias="SESSION_COOKIE_DOMAIN")
    session_cookie_secure_override: bool | None = Field(
        default=None,
        validation_alias="SESSION_COOKIE_SECURE",
    )

    @computed_field
    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins_raw.split(",") if origin.strip()]

    @computed_field
    @property
    def local_secret_file(self) -> Path:
        return self.state_dir / "runtime-secrets.json"

    @field_validator("session_cookie_domain", mode="before")
    @classmethod
    def normalize_cookie_domain(cls, value: object) -> str | None:
        if value is None:
            return None

        normalized = str(value).strip()
        return normalized or None

    @property
    def session_cookie_secure(self) -> bool:
        if self.session_cookie_secure_override is not None:
            return self.session_cookie_secure_override

        return self.environment.lower() not in LOCAL_ENVIRONMENTS

    def require_app_secret_key(self) -> str:
        if self.app_secret_key is None:
            raise RuntimeError("APP_SECRET_KEY is not configured.")

        return self.app_secret_key.get_secret_value()

    def require_integration_encryption_key(self) -> str:
        if self.integration_encryption_key is None:
            raise RuntimeError("INTEGRATION_ENCRYPTION_KEY is not configured.")

        return self.integration_encryption_key.get_secret_value()

    @model_validator(mode="after")
    def finalize_runtime_settings(self) -> "Settings":
        if self.app_secret_key is None or self.integration_encryption_key is None:
            if self.environment.lower() not in LOCAL_ENVIRONMENTS:
                missing = []
                if self.app_secret_key is None:
                    missing.append("APP_SECRET_KEY")
                if self.integration_encryption_key is None:
                    missing.append("INTEGRATION_ENCRYPTION_KEY")
                missing_fields = ", ".join(missing)
                raise ValueError(
                    f"{missing_fields} must be set outside local development or tests."
                )

            local_secrets = _load_or_create_local_secrets(self.local_secret_file)
            if self.app_secret_key is None:
                self.app_secret_key = SecretStr(local_secrets["app_secret_key"])
            if self.integration_encryption_key is None:
                self.integration_encryption_key = SecretStr(local_secrets["integration_encryption_key"])

        if self.session_cookie_samesite == "none" and not self.session_cookie_secure:
            raise ValueError("SESSION_COOKIE_SECURE must be true when SESSION_COOKIE_SAMESITE is 'none'.")

        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
