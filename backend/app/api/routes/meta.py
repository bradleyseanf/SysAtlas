from fastapi import APIRouter

from app.core.config import settings
from app.integrations.registry import list_providers

router = APIRouter()


@router.get("/meta")
def platform_meta() -> dict[str, object]:
    return {
        "name": settings.project_name,
        "environment": settings.environment,
        "features": [
            "bootstrap_authentication",
            "integration_catalog",
            "users_module",
            "devices_module",
            "encrypted_integration_storage",
        ],
        "planned_integrations": [
            provider.name for provider in list_providers()
        ],
    }
