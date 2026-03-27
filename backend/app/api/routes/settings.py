from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import require_any_permission, require_permission
from app.db.session import get_db
from app.models.user import User
from app.schemas.access_control import (
    AccessControlResponse,
    AccessProfileMutationResponse,
    AccessProfileUpsertRequest,
    AccessUserMutationResponse,
    AccessUserUpsertRequest,
)
from app.services.access_control import list_access_control_state, upsert_access_user, upsert_profile

router = APIRouter(prefix="/settings")


@router.get("/access-control", response_model=AccessControlResponse)
def get_access_control_state(
    db: Session = Depends(get_db),
    _: User = Depends(require_any_permission("settings.profiles.manage", "settings.users.manage")),
) -> AccessControlResponse:
    return list_access_control_state(db)


@router.post("/profiles", response_model=AccessProfileMutationResponse)
def save_access_profile(
    payload: AccessProfileUpsertRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("settings.profiles.manage")),
) -> AccessProfileMutationResponse:
    return upsert_profile(payload, db)


@router.post("/access-users", response_model=AccessUserMutationResponse)
def save_access_user(
    payload: AccessUserUpsertRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("settings.users.manage")),
) -> AccessUserMutationResponse:
    return upsert_access_user(payload, db)
