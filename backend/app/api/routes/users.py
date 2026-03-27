from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import require_permission
from app.db.session import get_db
from app.models.user import User
from app.schemas.inventory import UserListResponse
from app.services.inventory import list_managed_users

router = APIRouter(prefix="/users")


@router.get("", response_model=UserListResponse)
def get_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("users.view")),
) -> UserListResponse:
    return list_managed_users(db)
