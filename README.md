# SysAtlas

SysAtlas is an open source systems administration hub for onboarding, offboarding, access control, and future community-built integrations across platforms like Intune, Active Directory, Entra, Zoom, Zoho, Verizon, and Microsoft 365.

This repo is initialized as a Docker-ready monorepo with:

- `frontend/`: React + TypeScript + Tailwind CSS landing shell
- `backend/`: FastAPI service with environment-driven configuration
- `compose.yaml`: PostgreSQL + backend + frontend orchestration

## Security-first defaults

- No credentials are hardcoded in the application.
- `.env` is ignored by git and must be created locally by each deployment owner.
- Secrets and tenant-specific integration data are expected to be created only after a customer deploys their own instance.

## Current state

- A polished landing/login entry screen is in place for the frontend.
- Backend API scaffolding is ready with health and platform metadata endpoints.
- Database wiring is environment-driven and ready for future auth, onboarding, offboarding, audit, and integration modules.

## Quick start

1. Create a local `.env` from `.env.example`.
2. Review and replace all placeholder values with deployment-specific settings.
3. Start the stack with `docker compose up --build`.

## Planned next layers

- Authentication and first-user bootstrap flow
- Integration connection management
- Module-driven admin workflows
- Audit trails, job orchestration, and community extension points
