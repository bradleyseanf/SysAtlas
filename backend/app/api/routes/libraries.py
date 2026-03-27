from fastapi import APIRouter, Depends

from app.api.dependencies import require_permission
from app.models.user import User
from app.schemas.libraries import LibraryListResponse
from app.services.libraries import list_libraries

router = APIRouter(prefix="/libraries")


@router.get("", response_model=LibraryListResponse)
def get_libraries(
    _: User = Depends(require_permission("libraries.view")),
) -> LibraryListResponse:
    return list_libraries()
