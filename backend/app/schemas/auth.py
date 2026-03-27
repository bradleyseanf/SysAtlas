import re
from datetime import datetime

from pydantic import BaseModel, field_validator

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def normalize_name(value: str, field_name: str) -> str:
    normalized = value.strip()
    if not normalized:
        raise ValueError(f"{field_name} is required.")
    if len(normalized) > 120:
        raise ValueError(f"{field_name} must be 120 characters or fewer.")
    return normalized


def normalize_email(value: str) -> str:
    normalized = value.strip().lower()
    if not EMAIL_PATTERN.match(normalized):
        raise ValueError("Enter a valid email address.")
    return normalized


def validate_password_strength(value: str) -> str:
    if len(value) < 12:
        raise ValueError("Password must be at least 12 characters long.")
    if not any(character.isalpha() for character in value):
        raise ValueError("Password must include at least one letter.")
    if not any(character.isdigit() for character in value):
        raise ValueError("Password must include at least one number.")
    return value


class SetupStatusResponse(BaseModel):
    setup_required: bool
    user_count: int


class BootstrapRequest(BaseModel):
    first_name: str
    last_name: str
    email: str
    password: str

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
    def validate_password(cls, value: str) -> str:
        return validate_password_strength(value)


class LoginRequest(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        return normalize_email(value)

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if not value:
            raise ValueError("Password is required.")
        return value


class AuthUserProfile(BaseModel):
    id: str
    name: str
    description: str | None


class AuthenticatedUser(BaseModel):
    id: str
    first_name: str | None
    last_name: str | None
    display_name: str | None
    email: str
    is_active: bool
    is_superuser: bool
    role: str
    profile: AuthUserProfile | None
    permissions: list[str]
    created_at: datetime


class AuthResponse(BaseModel):
    message: str
    user: AuthenticatedUser


class SessionResponse(BaseModel):
    user: AuthenticatedUser
