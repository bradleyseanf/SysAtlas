from sqlalchemy import select
from sqlalchemy.orm import Session

from app.integrations.registry import list_providers_for_module
from app.models.integration_connection import IntegrationConnection
from app.models.managed_device import ManagedDevice
from app.models.managed_user import ManagedUser
from app.schemas.inventory import (
    DeviceListItem,
    DeviceListResponse,
    DeviceListStats,
    IntegrationOption,
    ModuleSourceStatus,
    UserListItem,
    UserListResponse,
    UserListStats,
)
from app.services.integrations import ACTIVE_CONNECTION_STATUSES, serialize_connection


def _configured_source_options(db: Session, module_name: str) -> list[IntegrationOption]:
    connections = db.scalars(
        select(IntegrationConnection).order_by(IntegrationConnection.updated_at.desc())
    ).all()
    source_options: list[IntegrationOption] = []
    for connection in connections:
        serialized = serialize_connection(connection)
        if serialized.status not in ACTIVE_CONNECTION_STATUSES:
            continue
        if module_name not in serialized.supported_modules:
            continue
        source_options.append(IntegrationOption(id=serialized.provider, name=serialized.provider_name))
    return source_options


def _suggested_source_options(module_name: str) -> list[IntegrationOption]:
    return [
        IntegrationOption(id=provider.slug, name=provider.name)
        for provider in list_providers_for_module(module_name)
    ]


def _module_source_status(db: Session, module_name: str) -> ModuleSourceStatus:
    configured_sources = _configured_source_options(db, module_name)
    has_configured_source = len(configured_sources) > 0
    empty_state_message = (
        "No integration setup yet. Connect a source system before trying to manage records here."
        if not has_configured_source
        else "Connections are configured, but no records have been synced into SysAtlas yet."
    )
    return ModuleSourceStatus(
        module=module_name,
        has_configured_source=has_configured_source,
        configured_sources=configured_sources,
        suggested_sources=_suggested_source_options(module_name),
        empty_state_message=empty_state_message,
    )


def list_managed_users(db: Session) -> UserListResponse:
    items = db.scalars(select(ManagedUser).order_by(ManagedUser.display_name.asc())).all()
    source_status = _module_source_status(db, "users")
    return UserListResponse(
        items=[
            UserListItem(
                id=str(item.id),
                display_name=item.display_name,
                email=item.email,
                source_provider=item.source_provider,
                title=item.title,
                department=item.department,
                lifecycle_state=item.lifecycle_state,
                account_status=item.account_status,
                device_count=item.device_count,
                last_activity_at=item.last_activity_at,
                last_synced_at=item.last_synced_at,
            )
            for item in items
        ],
        source_status=source_status,
        stats=UserListStats(
            total_users=len(items),
            active_users=sum(item.account_status == "active" for item in items),
            offboarding_users=sum(item.lifecycle_state == "offboarding" for item in items),
            connected_sources=len(source_status.configured_sources),
        ),
    )


def list_managed_devices(db: Session) -> DeviceListResponse:
    items = db.scalars(select(ManagedDevice).order_by(ManagedDevice.device_name.asc())).all()
    source_status = _module_source_status(db, "devices")
    return DeviceListResponse(
        items=[
            DeviceListItem(
                id=str(item.id),
                device_name=item.device_name,
                platform=item.platform,
                manufacturer=item.manufacturer,
                model=item.model,
                serial_number=item.serial_number,
                source_provider=item.source_provider,
                ownership=item.ownership,
                compliance_state=item.compliance_state,
                management_state=item.management_state,
                primary_user_email=item.primary_user_email,
                lifecycle_state=item.lifecycle_state,
                last_check_in_at=item.last_check_in_at,
            )
            for item in items
        ],
        source_status=source_status,
        stats=DeviceListStats(
            total_devices=len(items),
            compliant_devices=sum(item.compliance_state == "compliant" for item in items),
            action_required_devices=sum(item.compliance_state != "compliant" for item in items),
            connected_sources=len(source_status.configured_sources),
        ),
    )
