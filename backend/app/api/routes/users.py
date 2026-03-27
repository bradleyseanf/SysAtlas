from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.inventory import UserListResponse
from app.services.inventory import list_managed_users

router = APIRouter(prefix="/users")


@router.get("", response_model=UserListResponse)
def get_users(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> UserListResponse:
    return list_managed_users(db)
