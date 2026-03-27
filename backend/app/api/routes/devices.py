from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.inventory import DeviceListResponse
from app.services.inventory import list_managed_devices

router = APIRouter(prefix="/devices")


@router.get("", response_model=DeviceListResponse)
def get_devices(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> DeviceListResponse:
    return list_managed_devices(db)
