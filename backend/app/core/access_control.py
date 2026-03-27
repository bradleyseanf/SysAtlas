from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class PermissionDefinition:
    key: str
    label: str
    description: str
    group: str


@dataclass(frozen=True, slots=True)
class DefaultProfileDefinition:
    seed_key: str
    name: str
    description: str
    permissions: tuple[str, ...]
    system_managed: bool = True


PERMISSION_DEFINITIONS: tuple[PermissionDefinition, ...] = (
    PermissionDefinition(
        key="libraries.view",
        label="Libraries",
        description="Open the SharePoint libraries staging workspace.",
        group="Inventory",
    ),
    PermissionDefinition(
        key="users.view",
        label="Users Module",
        description="View the organization-wide user inventory sourced from connected platforms.",
        group="Inventory",
    ),
    PermissionDefinition(
        key="devices.view",
        label="Devices Module",
        description="View the organization-wide device inventory sourced from connected platforms.",
        group="Inventory",
    ),
    PermissionDefinition(
        key="settings.integrations.manage",
        label="Settings / Integrations",
        description="Launch provider sessions and manage platform integrations.",
        group="Administration",
    ),
    PermissionDefinition(
        key="settings.profiles.manage",
        label="Settings / Profiles",
        description="Create and manage reusable access profiles.",
        group="Administration",
    ),
    PermissionDefinition(
        key="settings.users.manage",
        label="Settings / Users",
        description="Create and manage the people who can sign in to SysAtlas.",
        group="Administration",
    ),
)

PERMISSION_DEFINITION_MAP = {item.key: item for item in PERMISSION_DEFINITIONS}
ALL_PERMISSION_KEYS = tuple(item.key for item in PERMISSION_DEFINITIONS)

DEFAULT_PROFILE_DEFINITIONS: tuple[DefaultProfileDefinition, ...] = (
    DefaultProfileDefinition(
        seed_key="platform_admin",
        name="Platform Admin",
        description="Full workspace access across modules, access control, and external integrations.",
        permissions=ALL_PERMISSION_KEYS,
    ),
    DefaultProfileDefinition(
        seed_key="identity_operations",
        name="Identity Operations",
        description="Focused access for library review, user inventory, and identity-source setup.",
        permissions=(
            "libraries.view",
            "users.view",
            "settings.integrations.manage",
        ),
    ),
    DefaultProfileDefinition(
        seed_key="device_operations",
        name="Device Operations",
        description="Focused access for staged libraries, device inventory, and device-source setup.",
        permissions=(
            "libraries.view",
            "devices.view",
            "settings.integrations.manage",
        ),
    ),
    DefaultProfileDefinition(
        seed_key="audit_viewer",
        name="Audit Viewer",
        description="Read-only inventory visibility without access to administrative settings.",
        permissions=(
            "libraries.view",
            "users.view",
            "devices.view",
        ),
    ),
)

DEFAULT_SUPERUSER_PROFILE_SEED = "platform_admin"
DEFAULT_STANDARD_PROFILE_SEED = "audit_viewer"
