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
    description: str | None
    permissions: tuple[str, ...]
    system_managed: bool = False


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
READ_ONLY_PERMISSION_KEYS = (
    "libraries.view",
    "users.view",
    "devices.view",
)

DEFAULT_PROFILE_DEFINITIONS: tuple[DefaultProfileDefinition, ...] = (
    DefaultProfileDefinition(
        seed_key="super_admin",
        name="Super Admin",
        description=None,
        permissions=ALL_PERMISSION_KEYS,
        system_managed=True,
    ),
    DefaultProfileDefinition(
        seed_key="admin",
        name="Admin",
        description=None,
        permissions=ALL_PERMISSION_KEYS,
    ),
    DefaultProfileDefinition(
        seed_key="user",
        name="User",
        description=None,
        permissions=READ_ONLY_PERMISSION_KEYS,
    ),
)

DEFAULT_SUPERUSER_PROFILE_SEED = "super_admin"
DEFAULT_ADMIN_PROFILE_SEED = "admin"
DEFAULT_STANDARD_PROFILE_SEED = "user"
PROFILE_DISPLAY_ORDER = (
    DEFAULT_SUPERUSER_PROFILE_SEED,
    DEFAULT_ADMIN_PROFILE_SEED,
    DEFAULT_STANDARD_PROFILE_SEED,
)
LEGACY_DEFAULT_PROFILE_SEEDS = (
    "platform_admin",
    "identity_operations",
    "device_operations",
    "audit_viewer",
)
