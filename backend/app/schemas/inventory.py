from datetime import datetime

from pydantic import BaseModel


class IntegrationOption(BaseModel):
    id: str
    name: str


class ModuleSourceStatus(BaseModel):
    module: str
    has_configured_source: bool
    configured_sources: list[IntegrationOption]
    suggested_sources: list[IntegrationOption]
    empty_state_message: str


class UserListItem(BaseModel):
    id: str
    display_name: str
    email: str
    source_provider: str
    title: str | None
    department: str | None
    lifecycle_state: str
    account_status: str
    device_count: int
    last_activity_at: datetime | None
    last_synced_at: datetime | None


class UserListStats(BaseModel):
    total_users: int
    active_users: int
    offboarding_users: int
    connected_sources: int


class UserListResponse(BaseModel):
    items: list[UserListItem]
    source_status: ModuleSourceStatus
    stats: UserListStats


class DeviceListItem(BaseModel):
    id: str
    device_name: str
    platform: str
    manufacturer: str | None
    model: str | None
    serial_number: str | None
    source_provider: str
    ownership: str
    compliance_state: str
    management_state: str
    primary_user_email: str | None
    lifecycle_state: str
    last_check_in_at: datetime | None


class DeviceListStats(BaseModel):
    total_devices: int
    compliant_devices: int
    action_required_devices: int
    connected_sources: int


class DeviceListResponse(BaseModel):
    items: list[DeviceListItem]
    source_status: ModuleSourceStatus
    stats: DeviceListStats
