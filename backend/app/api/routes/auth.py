from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.auth import AuthResponse, BootstrapRequest, LoginRequest, SetupStatusResponse
from app.services.auth import (
    authenticate_user,
    bootstrap_super_admin as bootstrap_super_admin_service,
    user_count,
)

router = APIRouter(prefix="/auth")


@router.get("/setup-status", response_model=SetupStatusResponse)
def get_setup_status(db: Session = Depends(get_db)) -> SetupStatusResponse:
    count = user_count(db)
    return SetupStatusResponse(setup_required=count == 0, user_count=count)


@router.post("/bootstrap", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def bootstrap_super_admin(payload: BootstrapRequest, db: Session = Depends(get_db)) -> AuthResponse:
    return bootstrap_super_admin_service(payload, db)


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthResponse:
    return authenticate_user(payload, db)
