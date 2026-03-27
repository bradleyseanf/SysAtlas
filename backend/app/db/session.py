from collections.abc import Generator
from contextlib import suppress

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.db.base import Base

engine_kwargs: dict[str, object] = {"pool_pre_ping": True}
if settings.database_url.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(settings.database_url, **engine_kwargs)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def database_status() -> str:
    return "configured"


def initialize_database() -> None:
    import app.models  # noqa: F401
    from app.services.system_settings import migrate_legacy_system_secrets

    Base.metadata.create_all(bind=engine)

    with suppress(Exception):
        existing_columns = {
            column["name"]
            for column in inspect(engine).get_columns("users")
        }

        missing_columns = []
        if "first_name" not in existing_columns:
            missing_columns.append("first_name")
        if "last_name" not in existing_columns:
            missing_columns.append("last_name")

        with engine.begin() as connection:
            for column_name in missing_columns:
                connection.execute(text(f"ALTER TABLE users ADD COLUMN {column_name} VARCHAR(120)"))

    with SessionLocal() as db:
        migrate_legacy_system_secrets(db)
