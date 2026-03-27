from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import AuthResponse, BootstrapRequest, LoginRequest, SessionResponse, SetupStatusResponse
from app.services.auth import (
    TOKEN_TTL,
    authenticate_user,
    bootstrap_super_admin as bootstrap_super_admin_service,
    serialize_user,
    user_count,
)

router = APIRouter(prefix="/auth")


def _apply_private_response_headers(response: Response) -> None:
    response.headers["Cache-Control"] = "no-store"
    response.headers["Pragma"] = "no-cache"


def _set_auth_cookie(response: Response, token: str) -> None:
    _apply_private_response_headers(response)
    response.set_cookie(
        key=settings.session_cookie_name,
        value=token,
        httponly=True,
        secure=settings.session_cookie_secure,
        samesite=settings.session_cookie_samesite,
        domain=settings.session_cookie_domain,
        max_age=int(TOKEN_TTL.total_seconds()),
        path="/",
    )


def _clear_auth_cookie(response: Response) -> None:
    _apply_private_response_headers(response)
    response.delete_cookie(
        key=settings.session_cookie_name,
        domain=settings.session_cookie_domain,
        path="/",
    )


@router.get("/setup-status", response_model=SetupStatusResponse)
def get_setup_status(db: Session = Depends(get_db)) -> SetupStatusResponse:
    count = user_count(db)
    return SetupStatusResponse(setup_required=count == 0, user_count=count)


@router.post("/bootstrap", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def bootstrap_super_admin(
    payload: BootstrapRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> AuthResponse:
    auth_response, access_token = bootstrap_super_admin_service(payload, db)
    _set_auth_cookie(response, access_token)
    return auth_response


@router.post("/login", response_model=AuthResponse)
def login(
    payload: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> AuthResponse:
    auth_response, access_token = authenticate_user(payload, db)
    _set_auth_cookie(response, access_token)
    return auth_response


@router.get("/session", response_model=SessionResponse)
def get_session(
    response: Response,
    current_user: User = Depends(get_current_user),
) -> SessionResponse:
    _apply_private_response_headers(response)
    return SessionResponse(user=serialize_user(current_user))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout() -> Response:
    response = Response(status_code=status.HTTP_204_NO_CONTENT)
    _clear_auth_cookie(response)
    return response
