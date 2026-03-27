from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.db.session import initialize_database


def create_application() -> FastAPI:
    application = FastAPI(
        title=settings.project_name,
        version="0.1.0",
        description=(
            "Open source systems administration orchestration for onboarding, "
            "offboarding, integrations, and workflow automation."
        ),
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @application.middleware("http")
    async def add_security_headers(request, call_next):
        response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "no-referrer")
        response.headers.setdefault("Permissions-Policy", "camera=(), geolocation=(), microphone=()")
        return response

    @application.on_event("startup")
    def startup() -> None:
        initialize_database()

    application.include_router(api_router, prefix=settings.api_v1_prefix)
    return application


app = create_application()
