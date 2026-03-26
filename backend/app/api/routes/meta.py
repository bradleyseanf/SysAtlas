from fastapi import APIRouter

from app.core.config import settings

router = APIRouter()


@router.get("/meta")
def platform_meta() -> dict[str, object]:
    return {
        "name": settings.project_name,
        "environment": settings.environment,
        "features": [
            "landing_portal",
            "integration_registry_placeholder",
            "workflow_modules_placeholder",
            "community_connector_foundation",
        ],
        "planned_integrations": [
            "Microsoft Intune",
            "Active Directory",
            "Entra ID",
            "Microsoft 365",
            "Zoom",
            "Zoho",
            "Verizon",
        ],
    }

