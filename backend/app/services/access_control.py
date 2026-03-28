import uuid
from collections.abc import Iterable

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.access_control import (
    ALL_PERMISSION_KEYS,
    DEFAULT_ADMIN_PROFILE_SEED,
    DEFAULT_PROFILE_DEFINITIONS,
    DEFAULT_STANDARD_PROFILE_SEED,
    DEFAULT_SUPERUSER_PROFILE_SEED,
    LEGACY_DEFAULT_PROFILE_SEEDS,
    PERMISSION_DEFINITION_MAP,
    PERMISSION_DEFINITIONS,
    PROFILE_DISPLAY_ORDER,
    READ_ONLY_PERMISSION_KEYS,
)
from app.core.security import hash_password
from app.models.access_profile import AccessProfile
from app.models.user import User
from app.schemas.access_control import (
    AccessControlResponse,
    AccessProfileMutationResponse,
    AccessProfileResponse,
    AccessProfileSummary,
    AccessProfileUpsertRequest,
    AccessUserMutationResponse,
    AccessUserResponse,
    AccessUserUpsertRequest,
    PermissionDefinitionResponse,
)

PROFILE_ORDER_INDEX = {seed_key: index for index, seed_key in enumerate(PROFILE_DISPLAY_ORDER)}
READ_ONLY_PERMISSION_SET = frozenset(READ_ONLY_PERMISSION_KEYS)
SUPER_ADMIN_RESERVED_MESSAGE = "Super Admin is reserved for the user who initialized this instance."


def permission_catalog() -> list[PermissionDefinitionResponse]:
    return [
        PermissionDefinitionResponse(
            key=item.key,
            label=item.label,
            description=item.description,
            group=item.group,
        )
        for item in PERMISSION_DEFINITIONS
    ]


def _sanitize_permission_keys(permission_keys: Iterable[str]) -> list[str]:
    ordered: list[str] = []
    seen: set[str] = set()

    for key in permission_keys:
        if key not in PERMISSION_DEFINITION_MAP or key in seen:
            continue
        seen.add(key)
        ordered.append(key)

    return ordered


def _profile_sort_key(profile: AccessProfile) -> tuple[int, str]:
    return (PROFILE_ORDER_INDEX.get(profile.seed_key or "", len(PROFILE_ORDER_INDEX)), profile.name.lower())


def _get_seed_profile(db: Session, seed_key: str) -> AccessProfile | None:
    return db.scalar(select(AccessProfile).where(AccessProfile.seed_key == seed_key))


def _primary_super_admin_user(db: Session) -> User | None:
    return db.scalar(select(User).order_by(User.created_at.asc(), User.email.asc()))


def _default_profile_for_standard_user(
    current_profile: AccessProfile | None,
    admin_profile: AccessProfile | None,
    user_profile: AccessProfile | None,
) -> AccessProfile | None:
    if current_profile is None:
        return user_profile

    if current_profile.seed_key == DEFAULT_ADMIN_PROFILE_SEED:
        return admin_profile

    if current_profile.seed_key == DEFAULT_STANDARD_PROFILE_SEED:
        return user_profile

    if current_profile.seed_key == DEFAULT_SUPERUSER_PROFILE_SEED:
        return admin_profile

    if current_profile.seed_key in LEGACY_DEFAULT_PROFILE_SEEDS:
        assigned_permissions = set(_sanitize_permission_keys(current_profile.permissions))
        if not assigned_permissions or assigned_permissions.issubset(READ_ONLY_PERMISSION_SET):
            return user_profile
        return admin_profile

    return current_profile


def ensure_default_profiles(db: Session) -> None:
    profiles = db.scalars(select(AccessProfile)).all()
    profiles_by_seed = {profile.seed_key: profile for profile in profiles if profile.seed_key}
    profiles_by_name = {profile.name.lower(): profile for profile in profiles}
    created = False

    for definition in DEFAULT_PROFILE_DEFINITIONS:
        profile = profiles_by_seed.get(definition.seed_key)
        seeded_now = False

        if profile is None:
            profile = profiles_by_name.get(definition.name.lower())
            if profile is None:
                profile = AccessProfile(
                    seed_key=definition.seed_key,
                    name=definition.name,
                    description=definition.description,
                    permissions=list(definition.permissions),
                    is_system_profile=definition.system_managed,
                )
                db.add(profile)
                profiles.append(profile)
            else:
                profile.seed_key = definition.seed_key
            profiles_by_seed[definition.seed_key] = profile
            profiles_by_name[definition.name.lower()] = profile
            created = True
            seeded_now = True

        desired_name_owner = profiles_by_name.get(definition.name.lower())
        if profile.name != definition.name and (desired_name_owner is None or desired_name_owner.id == profile.id):
            previous_name = profile.name.lower()
            profile.name = definition.name
            profiles_by_name.pop(previous_name, None)
            profiles_by_name[definition.name.lower()] = profile
            created = True

        if profile.description != definition.description:
            profile.description = definition.description
            created = True

        if profile.is_system_profile != definition.system_managed:
            profile.is_system_profile = definition.system_managed
            created = True

        if definition.system_managed or seeded_now:
            desired_permissions = list(definition.permissions)
            if _sanitize_permission_keys(profile.permissions) != desired_permissions:
                profile.permissions = desired_permissions
                created = True

    if created:
        db.flush()
        profiles = db.scalars(select(AccessProfile)).all()
        profiles_by_seed = {profile.seed_key: profile for profile in profiles if profile.seed_key}

    default_superuser_profile = profiles_by_seed.get(DEFAULT_SUPERUSER_PROFILE_SEED)
    default_admin_profile = profiles_by_seed.get(DEFAULT_ADMIN_PROFILE_SEED)
    default_standard_profile = profiles_by_seed.get(DEFAULT_STANDARD_PROFILE_SEED)
    profile_map = {profile.id: profile for profile in profiles}
    changed = created
    users = db.scalars(select(User).order_by(User.created_at.asc(), User.email.asc())).all()
    primary_super_admin_id = users[0].id if users else None

    for user in users:
        current_profile = profile_map.get(user.profile_id)

        if primary_super_admin_id is not None and user.id == primary_super_admin_id and default_superuser_profile is not None:
            target_profile = default_superuser_profile
            target_is_superuser = True
        else:
            target_profile = _default_profile_for_standard_user(
                current_profile,
                admin_profile=default_admin_profile,
                user_profile=default_standard_profile,
            )
            target_is_superuser = False

        if user.is_superuser != target_is_superuser:
            user.is_superuser = target_is_superuser
            changed = True

        if target_profile is not None and user.profile_id != target_profile.id:
            user.profile_id = target_profile.id
            changed = True

    for profile in profiles:
        if profile.seed_key in LEGACY_DEFAULT_PROFILE_SEEDS:
            db.delete(profile)
            changed = True

    if changed:
        db.commit()


def get_user_profile(user: User, db: Session) -> AccessProfile | None:
    if not user.profile_id:
        return None

    return db.get(AccessProfile, user.profile_id)


def permissions_for_user(user: User, db: Session, profile: AccessProfile | None = None) -> list[str]:
    if user.is_superuser:
        return list(ALL_PERMISSION_KEYS)

    resolved_profile = profile if profile is not None else get_user_profile(user, db)
    if resolved_profile is None:
        return []

    return _sanitize_permission_keys(resolved_profile.permissions)


def user_has_permission(user: User, permission_key: str, db: Session, profile: AccessProfile | None = None) -> bool:
    return permission_key in permissions_for_user(user, db, profile=profile)


def user_has_any_permission(
    user: User,
    permission_keys: Iterable[str],
    db: Session,
    profile: AccessProfile | None = None,
) -> bool:
    allowed = set(permissions_for_user(user, db, profile=profile))
    return any(permission_key in allowed for permission_key in permission_keys)


def _serialize_profile_summary(profile: AccessProfile | None) -> AccessProfileSummary | None:
    if profile is None:
        return None

    return AccessProfileSummary(
        id=profile.id,
        name=profile.name,
        description=profile.description,
    )


def serialize_profile(profile: AccessProfile, assigned_user_count: int) -> AccessProfileResponse:
    return AccessProfileResponse(
        id=profile.id,
        name=profile.name,
        description=profile.description,
        permissions=_sanitize_permission_keys(profile.permissions),
        is_system_profile=profile.is_system_profile,
        assigned_user_count=assigned_user_count,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )


def serialize_access_user(
    user: User,
    db: Session,
    profile: AccessProfile | None = None,
) -> AccessUserResponse:
    resolved_profile = profile if profile is not None else get_user_profile(user, db)
    return AccessUserResponse(
        id=str(user.id),
        first_name=user.first_name,
        last_name=user.last_name,
        display_name=user.display_name,
        email=user.email,
        is_active=user.is_active,
        is_superuser=user.is_superuser,
        profile=_serialize_profile_summary(resolved_profile),
        permissions=permissions_for_user(user, db, profile=resolved_profile),
        created_at=user.created_at,
        updated_at=user.updated_at,
    )


def list_access_control_state(db: Session) -> AccessControlResponse:
    ensure_default_profiles(db)
    profiles = sorted(db.scalars(select(AccessProfile)).all(), key=_profile_sort_key)
    users = db.scalars(select(User).order_by(User.is_superuser.desc(), User.created_at.asc())).all()
    assigned_user_counts = {
        profile_id: count
        for profile_id, count in db.execute(
            select(User.profile_id, func.count(User.id))
            .where(User.profile_id.is_not(None))
            .group_by(User.profile_id)
        ).all()
        if profile_id
    }
    profile_map = {profile.id: profile for profile in profiles}

    return AccessControlResponse(
        permissions=permission_catalog(),
        profiles=[
            serialize_profile(profile, assigned_user_counts.get(profile.id, 0))
            for profile in profiles
        ],
        users=[
            serialize_access_user(user, db, profile=profile_map.get(user.profile_id))
            for user in users
        ],
    )


def _profile_by_name(db: Session, profile_name: str) -> AccessProfile | None:
    return db.scalar(select(AccessProfile).where(func.lower(AccessProfile.name) == profile_name.lower()))


def _resolve_profile_for_user(payload: AccessUserUpsertRequest, db: Session) -> AccessProfile:
    ensure_default_profiles(db)

    if payload.profile_id:
        profile = db.get(AccessProfile, payload.profile_id)
        if profile is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="The selected access profile could not be found.",
            )
        if profile.seed_key == DEFAULT_SUPERUSER_PROFILE_SEED:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=SUPER_ADMIN_RESERVED_MESSAGE,
            )
        return profile

    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail="Select an access profile for this user.",
    )


def upsert_profile(payload: AccessProfileUpsertRequest, db: Session) -> AccessProfileMutationResponse:
    ensure_default_profiles(db)
    existing = _profile_by_name(db, payload.name)

    if payload.id:
        profile = db.get(AccessProfile, payload.id)
        if profile is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="The selected access profile could not be found.",
            )
        if profile.seed_key == DEFAULT_SUPERUSER_PROFILE_SEED:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="The Super Admin profile cannot be changed.",
            )
        if existing is not None and existing.id != profile.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An access profile with that name already exists.",
            )
        profile.name = payload.name
        profile.description = payload.description or None
        profile.permissions = list(payload.permissions)
        message = f"{profile.name} updated."
    else:
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An access profile with that name already exists.",
            )
        profile = AccessProfile(
            name=payload.name,
            description=payload.description or None,
            permissions=list(payload.permissions),
            is_system_profile=False,
        )
        db.add(profile)
        message = f"{payload.name} created."

    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An access profile with that name already exists.",
        ) from error

    db.refresh(profile)

    assigned_user_count = db.scalar(select(func.count(User.id)).where(User.profile_id == profile.id)) or 0
    return AccessProfileMutationResponse(
        message=message,
        item=serialize_profile(profile, assigned_user_count=assigned_user_count),
    )


def upsert_access_user(payload: AccessUserUpsertRequest, db: Session) -> AccessUserMutationResponse:
    ensure_default_profiles(db)
    primary_super_admin = _primary_super_admin_user(db)
    super_admin_profile = _get_seed_profile(db, DEFAULT_SUPERUSER_PROFILE_SEED)
    existing_email_owner = db.scalar(select(User).where(func.lower(User.email) == payload.email))

    if payload.id:
        try:
            user_id = uuid.UUID(payload.id)
        except ValueError as error:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="The selected access user could not be found.",
            ) from error

        user = db.get(User, user_id)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="The selected access user could not be found.",
            )

        if existing_email_owner is not None and existing_email_owner.id != user.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A SysAtlas user with that email already exists.",
            )

        is_primary_super_admin = primary_super_admin is not None and user.id == primary_super_admin.id
        if payload.is_superuser and not is_primary_super_admin:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=SUPER_ADMIN_RESERVED_MESSAGE,
            )
        selected_profile = (
            super_admin_profile
            if is_primary_super_admin
            else _resolve_profile_for_user(payload, db)
        )

        user.first_name = payload.first_name
        user.last_name = payload.last_name
        user.display_name = f"{payload.first_name} {payload.last_name}".strip()
        user.email = payload.email
        user.profile_id = selected_profile.id if selected_profile is not None else user.profile_id
        user.is_active = payload.is_active
        user.is_superuser = is_primary_super_admin
        if payload.password:
            user.hashed_password = hash_password(payload.password)
        message = f"{user.display_name or user.email} updated."
    else:
        if existing_email_owner is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A SysAtlas user with that email already exists.",
            )
        if not payload.password:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Set a password before creating a user.",
            )
        if payload.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=SUPER_ADMIN_RESERVED_MESSAGE,
            )
        selected_profile = _resolve_profile_for_user(payload, db)

        user = User(
            first_name=payload.first_name,
            last_name=payload.last_name,
            display_name=f"{payload.first_name} {payload.last_name}".strip(),
            email=payload.email,
            hashed_password=hash_password(payload.password),
            is_active=payload.is_active,
            is_superuser=False,
            profile_id=selected_profile.id,
        )
        db.add(user)
        message = f"{user.display_name} created."

    try:
        db.commit()
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A SysAtlas user with that email already exists.",
        ) from error

    db.refresh(user)

    return AccessUserMutationResponse(
        message=message,
        item=serialize_access_user(user, db, profile=selected_profile),
    )
