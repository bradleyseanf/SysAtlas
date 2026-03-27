import secrets
from datetime import timedelta

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.schemas.auth import AuthResponse, AuthenticatedUser, BootstrapRequest, LoginRequest
from app.services.system_settings import APP_SECRET_KEY, get_or_create_setting_value

TOKEN_TTL = timedelta(hours=12)


def user_count(db: Session) -> int:
    return db.scalar(select(func.count()).select_from(User)) or 0


def serialize_user(user: User) -> AuthenticatedUser:
    return AuthenticatedUser(
        id=str(user.id),
        first_name=user.first_name,
        last_name=user.last_name,
        display_name=user.display_name,
        email=user.email,
        is_active=user.is_active,
        is_superuser=user.is_superuser,
        role="super_admin" if user.is_superuser else "user",
        created_at=user.created_at,
    )


def _access_token_for_user(db: Session, user: User) -> str:
    secret = get_or_create_setting_value(
        db,
        APP_SECRET_KEY,
        generator=lambda: secrets.token_urlsafe(48),
        is_secret=True,
    )
    return create_access_token(
        subject=str(user.id),
        email=user.email,
        secret=secret,
        expires_in=TOKEN_TTL,
    )


def bootstrap_super_admin(payload: BootstrapRequest, db: Session) -> AuthResponse:
    if user_count(db) > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="SysAtlas has already been initialized.",
        )

    display_name = f"{payload.first_name} {payload.last_name}".strip()
    user = User(
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email,
        display_name=display_name,
        hashed_password=hash_password(payload.password),
        is_active=True,
        is_superuser=True,
    )

    db.add(user)

    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="SysAtlas has already been initialized.",
        ) from error

    db.refresh(user)

    return AuthResponse(
        message="First super admin account created.",
        access_token=_access_token_for_user(db, user),
        user=serialize_user(user),
    )


def authenticate_user(payload: LoginRequest, db: Session) -> AuthResponse:
    if user_count(db) == 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Instance setup is required before sign-in.",
        )

    user = db.scalar(select(User).where(func.lower(User.email) == payload.email))
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been disabled.",
        )

    return AuthResponse(
        message=f"Welcome back, {user.display_name or user.email}.",
        access_token=_access_token_for_user(db, user),
        user=serialize_user(user),
    )
