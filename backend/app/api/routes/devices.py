from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import require_permission
from app.db.session import get_db
from app.models.user import User
from app.schemas.inventory import DeviceListResponse
from app.services.inventory import list_managed_devices

router = APIRouter(prefix="/devices")


@router.get("", response_model=DeviceListResponse)
def get_devices(
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("devices.view")),
) -> DeviceListResponse:
    return list_managed_devices(db)
