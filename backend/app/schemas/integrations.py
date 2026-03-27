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
