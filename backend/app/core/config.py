from functools import lru_cache

from pydantic import Field, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    project_name: str = "SysAtlas"
    environment: str = "development"
    api_v1_prefix: str = "/api/v1"
    database_url: str | None = None
    cors_origins_raw: str = Field(
        default="http://localhost:3000,http://localhost:5173",
        validation_alias="CORS_ORIGINS",
    )

    @computed_field
    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins_raw.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
