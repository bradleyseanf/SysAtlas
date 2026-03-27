from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies import require_permission
from app.db.session import get_db
from app.models.user import User
from app.schemas.integrations import (
    IntegrationCatalogResponse,
    IntegrationConnectionMutationResponse,
    IntegrationConnectionUpsertRequest,
    IntegrationListResponse,
)
from app.services.integrations import catalog_response, list_connections, upsert_connection

router = APIRouter(prefix="/integrations")


@router.get("/catalog", response_model=IntegrationCatalogResponse)
def get_integration_catalog(_: User = Depends(require_permission("settings.integrations.manage"))) -> IntegrationCatalogResponse:
    return catalog_response()


@router.get("", response_model=IntegrationListResponse)
def get_integration_connections(
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("settings.integrations.manage")),
) -> IntegrationListResponse:
    return list_connections(db)


@router.post("", response_model=IntegrationConnectionMutationResponse)
def save_integration_connection(
    payload: IntegrationConnectionUpsertRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("settings.integrations.manage")),
) -> IntegrationConnectionMutationResponse:
    return upsert_connection(payload, db)
