from datetime import timedelta

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.schemas.auth import AuthResponse, AuthenticatedUser, AuthUserProfile, BootstrapRequest, LoginRequest
from app.services.access_control import ensure_default_profiles, get_user_profile, permissions_for_user

TOKEN_TTL = timedelta(hours=12)


def user_count(db: Session) -> int:
    return db.scalar(select(func.count()).select_from(User)) or 0


def serialize_user(user: User, db: Session) -> AuthenticatedUser:
    ensure_default_profiles(db)
    profile = get_user_profile(user, db)
    return AuthenticatedUser(
        id=str(user.id),
        first_name=user.first_name,
        last_name=user.last_name,
        display_name=user.display_name,
        email=user.email,
        is_active=user.is_active,
        is_superuser=user.is_superuser,
        role="super_admin" if user.is_superuser else "user",
        profile=(
            AuthUserProfile(
                id=profile.id,
                name=profile.name,
                description=profile.description,
            )
            if profile is not None
            else None
        ),
        permissions=permissions_for_user(user, db, profile=profile),
        created_at=user.created_at,
    )


def _access_token_for_user(user: User) -> str:
    return create_access_token(
        subject=str(user.id),
        email=user.email,
        secret=settings.require_app_secret_key(),
        expires_in=TOKEN_TTL,
    )


def bootstrap_super_admin(payload: BootstrapRequest, db: Session) -> tuple[AuthResponse, str]:
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
    ensure_default_profiles(db)
    db.refresh(user)

    response = AuthResponse(
        message="First super admin account created.",
        user=serialize_user(user, db),
    )
    return response, _access_token_for_user(user)


def authenticate_user(payload: LoginRequest, db: Session) -> tuple[AuthResponse, str]:
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

    response = AuthResponse(
        message=f"Welcome back, {user.display_name or user.email}.",
        user=serialize_user(user, db),
    )
    return response, _access_token_for_user(user)
