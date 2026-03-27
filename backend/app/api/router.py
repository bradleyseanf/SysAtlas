from fastapi import APIRouter

from app.api.routes.auth import router as auth_router
from app.api.routes.devices import router as devices_router
from app.api.routes.health import router as health_router
from app.api.routes.integrations import router as integrations_router
from app.api.routes.libraries import router as libraries_router
from app.api.routes.meta import router as meta_router
from app.api.routes.settings import router as settings_router
from app.api.routes.users import router as users_router

api_router = APIRouter()
api_router.include_router(auth_router, tags=["auth"])
api_router.include_router(libraries_router, tags=["libraries"])
api_router.include_router(users_router, tags=["users"])
api_router.include_router(devices_router, tags=["devices"])
api_router.include_router(integrations_router, tags=["integrations"])
api_router.include_router(settings_router, tags=["settings"])
api_router.include_router(health_router, tags=["health"])
api_router.include_router(meta_router, tags=["meta"])
