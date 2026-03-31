from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import HTMLResponse, Response
from sqlalchemy.orm import Session

from app.api.dependencies import require_permission
from app.db.session import get_db
from app.integrations.intune.oauth import begin_oauth_flow as begin_intune_oauth_flow
from app.integrations.intune.oauth import complete_oauth_flow as complete_intune_oauth_flow
from app.integrations.intune.oauth import import_devices_from_connection as import_intune_devices_from_connection
from app.integrations.zoho.oauth import begin_oauth_flow as begin_zoho_oauth_flow
from app.integrations.zoho.oauth import complete_oauth_flow as complete_zoho_oauth_flow
from app.integrations.zoho.oauth import get_oauth_config as get_zoho_oauth_config
from app.integrations.zoho.oauth import save_oauth_config as save_zoho_oauth_config
from app.models.user import User
from app.schemas.integrations import (
    IntegrationCatalogResponse,
    IntegrationOauthConfigResponse,
    IntegrationOauthConfigUpsertRequest,
    IntegrationConnectionMutationResponse,
    IntegrationConnectionUpsertRequest,
    IntegrationImportResponse,
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


@router.get("/{provider}/oauth/config", response_model=IntegrationOauthConfigResponse)
def get_provider_oauth_config(
    provider: str,
    request: Request,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("settings.integrations.manage")),
) -> IntegrationOauthConfigResponse:
    if provider != "zoho":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="OAuth config is not implemented for this integration yet.",
        )

    return get_zoho_oauth_config(db=db, request=request)


@router.post("/{provider}/oauth/config", response_model=IntegrationOauthConfigResponse)
def save_provider_oauth_config(
    provider: str,
    payload: IntegrationOauthConfigUpsertRequest,
    request: Request,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("settings.integrations.manage")),
) -> IntegrationOauthConfigResponse:
    if provider != "zoho":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="OAuth config is not implemented for this integration yet.",
        )

    save_zoho_oauth_config(db=db, payload=payload)
    return get_zoho_oauth_config(db=db, request=request)


@router.get("/{provider}/oauth/start", name="start_provider_oauth", response_model=None)
def start_provider_oauth(
    provider: str,
    request: Request,
    frontend_origin: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("settings.integrations.manage")),
) -> Response:
    if provider == "intune":
        return begin_intune_oauth_flow(
            frontend_origin=frontend_origin,
            current_user=current_user,
        )

    if provider != "zoho":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="OAuth launch is not implemented for this integration yet.",
        )

    return begin_zoho_oauth_flow(
        db=db,
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
    if provider == "intune":
        return complete_intune_oauth_flow(
            db=db,
            state=state,
            code=code,
            error=error,
            error_description=error_description,
        )

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


@router.post("/{provider}/import/devices", response_model=IntegrationImportResponse)
def import_provider_devices(
    provider: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("settings.integrations.manage")),
) -> IntegrationImportResponse:
    if provider != "intune":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device import is not implemented for this integration yet.",
        )

    result = import_intune_devices_from_connection(db=db)
    return IntegrationImportResponse(
        message=f"Imported {result.imported_count + result.updated_count} Intune devices into SysAtlas.",
        imported_count=result.imported_count,
        updated_count=result.updated_count,
        total_count=result.total_count,
    )
