import uuid
from datetime import datetime

from sqlalchemy import JSON, DateTime, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class IntegrationConnection(Base):
    __tablename__ = "integration_connections"

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider: Mapped[str] = mapped_column(String(120), index=True)
    tenant_label: Mapped[str] = mapped_column(String(255))
    auth_strategy: Mapped[str] = mapped_column(String(80))
    status: Mapped[str] = mapped_column(String(50), default="disconnected")
    scopes: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    encrypted_config: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    secret_reference: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
