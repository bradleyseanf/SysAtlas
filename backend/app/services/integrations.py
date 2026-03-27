from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.integrations.registry import get_provider, list_providers
from app.integrations.types import IntegrationProviderDefinition
from app.models.integration_connection import IntegrationConnection
from app.schemas.integrations import (
    IntegrationCatalogResponse,
    IntegrationConnectionMutationResponse,
    IntegrationConnectionResponse,
    IntegrationConnectionUpsertRequest,
    IntegrationFieldDefinitionResponse,
    IntegrationListResponse,
    IntegrationProviderResponse,
)
from app.services.integration_secrets import decrypt_config, encrypt_config

ACTIVE_CONNECTION_STATUSES = {"configured", "connected"}


def serialize_provider(provider: IntegrationProviderDefinition) -> IntegrationProviderResponse:
    return IntegrationProviderResponse(
        id=provider.slug,
        name=provider.name,
        category=provider.category,
        description=provider.description,
        auth_strategy=provider.auth_strategy,
        supported_modules=list(provider.supported_modules),
        fields=[
            IntegrationFieldDefinitionResponse(
                key=field.key,
                label=field.label,
                input_type=field.input_type,
                placeholder=field.placeholder or None,
                help_text=field.help_text or None,
                required=field.required,
                secret=field.secret,
            )
            for field in provider.fields
        ],
        setup_mode=provider.setup_mode,
        launch_url=provider.launch_url,
        documentation_url=provider.documentation_url or None,
        launch_button_label=provider.launch_button_label,
        setup_steps=list(provider.setup_steps),
        security_notes=list(provider.security_notes),
    )


def catalog_response() -> IntegrationCatalogResponse:
    return IntegrationCatalogResponse(providers=[serialize_provider(provider) for provider in list_providers()])


def _config_preview(provider: IntegrationProviderDefinition, decrypted_config: dict[str, str]) -> tuple[dict[str, str], list[str], list[str]]:
    configured_fields: list[str] = []
    configured_secret_fields: list[str] = []
    preview: dict[str, str] = {}

    for field in provider.fields:
        value = decrypted_config.get(field.key, "").strip()
        if not value:
            continue
        configured_fields.append(field.key)
        if field.secret:
            configured_secret_fields.append(field.key)
        else:
            preview[field.key] = value

    return preview, configured_fields, configured_secret_fields


def serialize_connection(connection: IntegrationConnection) -> IntegrationConnectionResponse:
    provider = get_provider(connection.provider)
    if provider is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Integration provider '{connection.provider}' is no longer registered.",
        )

    decrypted_config = decrypt_config(connection.encrypted_config)
    preview, configured_fields, configured_secret_fields = _config_preview(provider, decrypted_config)
    return IntegrationConnectionResponse(
        id=str(connection.id),
        provider=provider.slug,
        provider_name=provider.name,
        category=provider.category,
        description=provider.description,
        tenant_label=connection.tenant_label,
        auth_strategy=connection.auth_strategy,
        status=connection.status,
        supported_modules=list(provider.supported_modules),
        configured_fields=configured_fields,
        configured_secret_fields=configured_secret_fields,
        config_preview=preview,
        scopes=connection.scopes,
        created_at=connection.created_at,
        updated_at=connection.updated_at,
    )


def list_connections(db: Session) -> IntegrationListResponse:
    items = db.scalars(
        select(IntegrationConnection).order_by(IntegrationConnection.updated_at.desc())
    ).all()
    return IntegrationListResponse(items=[serialize_connection(item) for item in items])


def upsert_connection(payload: IntegrationConnectionUpsertRequest, db: Session) -> IntegrationConnectionMutationResponse:
    provider = get_provider(payload.provider)
    if provider is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Unknown integration provider.",
        )

    existing = db.scalar(
        select(IntegrationConnection).where(IntegrationConnection.provider == provider.slug)
    )
    existing_decrypted = decrypt_config(existing.encrypted_config) if existing else {}
    merged_config: dict[str, str] = {}

    for field in provider.fields:
        submitted_value = payload.config.get(field.key, "").strip()
        if submitted_value:
            merged_config[field.key] = submitted_value
            continue

        if existing and field.key in existing_decrypted:
            merged_config[field.key] = existing_decrypted[field.key]
            continue

        if provider.setup_mode != "external_browser" and field.required:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"{field.label} is required.",
            )

    encrypted_config = encrypt_config(merged_config)

    if existing is None:
        connection = IntegrationConnection(
            provider=provider.slug,
            tenant_label=payload.tenant_label,
            auth_strategy=provider.auth_strategy,
            status=payload.status,
            scopes=payload.scopes,
            encrypted_config=encrypted_config,
        )
        db.add(connection)
    else:
        existing.tenant_label = payload.tenant_label
        existing.auth_strategy = provider.auth_strategy
        existing.status = payload.status
        existing.scopes = payload.scopes
        existing.encrypted_config = encrypted_config
        connection = existing

    db.commit()
    db.refresh(connection)

    return IntegrationConnectionMutationResponse(
        message=f"{provider.name} integration saved.",
        item=serialize_connection(connection),
    )
