from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session

from app.api.dependencies import require_permission
from app.db.session import get_db
from app.integrations.zoho.oauth import begin_oauth_flow as begin_zoho_oauth_flow
from app.integrations.zoho.oauth import complete_oauth_flow as complete_zoho_oauth_flow
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


@router.get("/{provider}/oauth/start", name="start_provider_oauth")
def start_provider_oauth(
    provider: str,
    request: Request,
    frontend_origin: str = Query(...),
    current_user: User = Depends(require_permission("settings.integrations.manage")),
) -> RedirectResponse:
    if provider != "zoho":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="OAuth launch is not implemented for this integration yet.",
        )

    return begin_zoho_oauth_flow(
        request=request,
        frontend_origin=frontend_origin,
        current_user=current_user,
    )


@router.get("/{provider}/oauth/callback", name="complete_provider_oauth")
def complete_provider_oauth(
    provider: str,
    request: Request,
    state: str = Query(...),
    code: str | None = Query(default=None),
    error: str | None = Query(default=None),
    error_description: str | None = Query(default=None),
    accounts_server: str | None = Query(default=None, alias="accounts-server"),
    db: Session = Depends(get_db),
) -> HTMLResponse:
    if provider != "zoho":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="OAuth callback is not implemented for this integration yet.",
        )

    return complete_zoho_oauth_flow(
        request=request,
        db=db,
        state=state,
        code=code,
        error=error,
        error_description=error_description,
        accounts_server=accounts_server,
    )
