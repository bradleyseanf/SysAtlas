from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

InputType = Literal["text", "password", "email", "url", "textarea"]


class IntegrationFieldDefinitionResponse(BaseModel):
    key: str
    label: str
    input_type: InputType
    placeholder: str | None = None
    help_text: str | None = None
    required: bool = True
    secret: bool = False


class IntegrationProviderResponse(BaseModel):
    id: str
    name: str
    category: str
    description: str
    auth_strategy: str
    supported_modules: list[str]
    fields: list[IntegrationFieldDefinitionResponse]
    setup_mode: str
    launch_url: str
    documentation_url: str | None = None
    launch_button_label: str
    setup_steps: list[str]
    security_notes: list[str]


class IntegrationConnectionResponse(BaseModel):
    id: str
    provider: str
    provider_name: str
    category: str
    description: str
    tenant_label: str
    auth_strategy: str
    status: str
    supported_modules: list[str]
    configured_fields: list[str]
    configured_secret_fields: list[str]
    config_preview: dict[str, str]
    scopes: list[str] | None
    created_at: datetime
    updated_at: datetime


class IntegrationCatalogResponse(BaseModel):
    providers: list[IntegrationProviderResponse]


class IntegrationListResponse(BaseModel):
    items: list[IntegrationConnectionResponse]


class IntegrationSourceReference(BaseModel):
    id: str
    name: str


class IntegrationConnectionUpsertRequest(BaseModel):
    provider: str
    tenant_label: str
    config: dict[str, str] = Field(default_factory=dict)
    status: str = "configured"
    scopes: list[str] | None = None

    @field_validator("provider")
    @classmethod
    def validate_provider(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Provider is required.")
        return normalized

    @field_validator("tenant_label")
    @classmethod
    def validate_tenant_label(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Connection name is required.")
        if len(normalized) > 255:
            raise ValueError("Connection name must be 255 characters or fewer.")
        return normalized


class IntegrationConnectionMutationResponse(BaseModel):
    message: str
    item: IntegrationConnectionResponse


class IntegrationOauthConfigResponse(BaseModel):
    provider: str
    configured: bool
    source: Literal["environment", "database", "missing"]
    redirect_uri: str
    client_id_hint: str | None = None


class IntegrationOauthConfigUpsertRequest(BaseModel):
    client_id: str
    client_secret: str

    @field_validator("client_id")
    @classmethod
    def validate_client_id(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Client ID is required.")
        if len(normalized) > 255:
            raise ValueError("Client ID must be 255 characters or fewer.")
        return normalized

    @field_validator("client_secret")
    @classmethod
    def validate_client_secret(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Client secret is required.")
        if len(normalized) > 1024:
            raise ValueError("Client secret must be 1024 characters or fewer.")
        return normalized
