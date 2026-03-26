from fastapi import APIRouter

from app.core.config import settings
from app.db.session import database_status

router = APIRouter()


@router.get("/health")
def healthcheck() -> dict[str, str]:
    return {
        "status": "ok",
        "service": settings.project_name,
        "environment": settings.environment,
        "database": database_status(),
    }

