from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.core.access_control import PERMISSION_DEFINITION_MAP
from app.schemas.auth import normalize_email, normalize_name, validate_password_strength


def _normalize_optional_text(value: str, max_length: int) -> str:
    normalized = value.strip()
    if len(normalized) > max_length:
        raise ValueError(f"Must be {max_length} characters or fewer.")
    return normalized


class PermissionDefinitionResponse(BaseModel):
    key: str
    label: str
    description: str
    group: str


class AccessProfileSummary(BaseModel):
    id: str
    name: str
    description: str | None


class AccessProfileResponse(BaseModel):
    id: str
    name: str
    description: str | None
    permissions: list[str]
    is_system_profile: bool
    assigned_user_count: int
    created_at: datetime
    updated_at: datetime


class AccessUserResponse(BaseModel):
    id: str
    first_name: str | None
    last_name: str | None
    display_name: str | None
    email: str
    is_active: bool
    is_superuser: bool
    profile: AccessProfileSummary | None
    permissions: list[str]
    created_at: datetime
    updated_at: datetime


class AccessControlResponse(BaseModel):
    permissions: list[PermissionDefinitionResponse]
    profiles: list[AccessProfileResponse]
    users: list[AccessUserResponse]


class AccessProfileUpsertRequest(BaseModel):
    id: str | None = None
    name: str
    description: str = ""
    permissions: list[str] = Field(default_factory=list)

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        return normalize_name(value, "Profile name")

    @field_validator("description")
    @classmethod
    def validate_description(cls, value: str) -> str:
        return _normalize_optional_text(value, 255)

    @field_validator("permissions")
    @classmethod
    def validate_permissions(cls, value: list[str]) -> list[str]:
        seen: set[str] = set()
        normalized: list[str] = []
        for permission in value:
            key = permission.strip()
            if not key:
                continue
            if key not in PERMISSION_DEFINITION_MAP:
                raise ValueError(f"Unknown permission '{key}'.")
            if key in seen:
                continue
            seen.add(key)
            normalized.append(key)

        if not normalized:
            raise ValueError("Select at least one permission.")

        return normalized


class AccessProfileMutationResponse(BaseModel):
    message: str
    item: AccessProfileResponse


class AccessUserUpsertRequest(BaseModel):
    id: str | None = None
    first_name: str
    last_name: str
    email: str
    password: str | None = None
    profile_id: str | None = None
    is_active: bool = True
    is_superuser: bool = False

    @field_validator("first_name")
    @classmethod
    def validate_first_name(cls, value: str) -> str:
        return normalize_name(value, "First name")

    @field_validator("last_name")
    @classmethod
    def validate_last_name(cls, value: str) -> str:
        return normalize_name(value, "Last name")

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return normalize_email(value)

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str | None) -> str | None:
        if value is None:
            return None

        normalized = value.strip()
        if not normalized:
            return None

        return validate_password_strength(normalized)

    @field_validator("profile_id")
    @classmethod
    def validate_profile_id(cls, value: str | None) -> str | None:
        if value is None:
            return None

        normalized = value.strip()
        return normalized or None


class AccessUserMutationResponse(BaseModel):
    message: str
    item: AccessUserResponse
