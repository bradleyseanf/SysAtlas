import type { AuthUser } from "../types/api";

export const moduleRoutePermissions = {
  libraries: "libraries.view",
  users: "users.view",
  devices: "devices.view",
} as const;

export const settingsRoutePermissions = {
  profiles: "settings.profiles.manage",
  users: "settings.users.manage",
  integrations: "settings.integrations.manage",
} as const;

export const settingsNavigation = [
  {
    to: "/settings/profiles",
    label: "Profiles",
    description: "Reusable access profiles for modules and settings.",
    permission: settingsRoutePermissions.profiles,
  },
  {
    to: "/settings/users",
    label: "Users",
    description: "People who can sign in to SysAtlas, not inventory users.",
    permission: settingsRoutePermissions.users,
  },
  {
    to: "/settings/integrations",
    label: "Integrations",
    description: "Provider-hosted connection sessions and linked sources.",
    permission: settingsRoutePermissions.integrations,
  },
] as const;

export function hasPermission(user: AuthUser, permission: string) {
  return user.is_superuser || user.permissions.includes(permission);
}

export function accessibleSettingsNavigation(user: AuthUser) {
  return settingsNavigation.filter((item) => hasPermission(user, item.permission));
}

export function defaultSettingsRoute(user: AuthUser) {
  return accessibleSettingsNavigation(user)[0]?.to ?? null;
}

export function defaultAuthorizedRoute(user: AuthUser) {
  return "/home";
}

export function pageTitleForPath(pathname: string) {
  if (pathname.startsWith("/settings/profiles")) {
    return "Profiles";
  }
  if (pathname.startsWith("/settings/users")) {
    return "Access Users";
  }
  if (pathname.startsWith("/settings/integrations")) {
    return "Integrations";
  }
  if (pathname.startsWith("/home")) {
    return "Home";
  }
  if (pathname.startsWith("/libraries")) {
    return "Libraries";
  }
  if (pathname.startsWith("/users")) {
    return "Users";
  }
  if (pathname.startsWith("/devices")) {
    return "Devices";
  }
  if (pathname.startsWith("/settings")) {
    return "Settings";
  }
  return "Home";
}
