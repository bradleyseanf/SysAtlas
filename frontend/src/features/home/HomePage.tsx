import { useQuery } from "@tanstack/react-query";
import { CBadge, CCard, CCardBody, CCardHeader, CCol, CRow } from "@coreui/react";
import { Link } from "react-router-dom";

import { StatCard } from "../../components/StatCard";
import { api } from "../../lib/api";
import { hasPermission, moduleRoutePermissions, settingsRoutePermissions } from "../../lib/access";
import { useDevModeUrlState } from "../../lib/devMode";
import { getTestDevicesResponse, getTestUsersResponse } from "../../tests/inventoryFixtures";
import { useAuth } from "../auth/AuthContext";

function librarySourceCount(items: Array<{ children: Array<unknown> }>) {
  return items.reduce((count, item) => count + item.children.length, 0);
}

export function HomePage() {
  const { session } = useAuth();
  const { isDevMode, withDevMode } = useDevModeUrlState();

  if (!session) {
    return null;
  }

  const canViewLibraries = hasPermission(session.user, moduleRoutePermissions.libraries);
  const canViewUsers = hasPermission(session.user, moduleRoutePermissions.users);
  const canViewDevices = hasPermission(session.user, moduleRoutePermissions.devices);
  const canManageProfiles = hasPermission(session.user, settingsRoutePermissions.profiles);
  const canManageAccessUsers = hasPermission(session.user, settingsRoutePermissions.users);
  const canManageIntegrations = hasPermission(session.user, settingsRoutePermissions.integrations);

  const librariesQuery = useQuery({
    queryKey: ["libraries"],
    queryFn: api.getLibraries,
    enabled: canViewLibraries,
  });

  const usersQuery = useQuery({
    queryKey: ["users", isDevMode ? "dev" : "live"],
    queryFn: () => (isDevMode ? Promise.resolve(getTestUsersResponse()) : api.getUsers()),
    enabled: canViewUsers,
  });

  const devicesQuery = useQuery({
    queryKey: ["devices", isDevMode ? "dev" : "live"],
    queryFn: () => (isDevMode ? Promise.resolve(getTestDevicesResponse()) : api.getDevices()),
    enabled: canViewDevices,
  });

  const accessControlQuery = useQuery({
    queryKey: ["settings", "access-control"],
    queryFn: api.getAccessControl,
    enabled: canManageProfiles || canManageAccessUsers || canManageIntegrations,
  });

  const snapshotCards = [
    canViewLibraries
      ? {
          label: "Library Sources",
          value: librariesQuery.data ? librarySourceCount(librariesQuery.data.items) : "--",
          caption: "Connected SharePoint and Teams sources visible to this workspace.",
        }
      : null,
    canViewUsers
      ? {
          label: "Users",
          value: usersQuery.data?.stats.total_users ?? "--",
          caption: "Organization user records currently available in SysAtlas.",
        }
      : null,
    canViewDevices
      ? {
          label: "Devices",
          value: devicesQuery.data?.stats.total_devices ?? "--",
          caption: "Managed device records currently available in SysAtlas.",
        }
      : null,
    canManageAccessUsers
      ? {
          label: "Access Users",
          value: accessControlQuery.data?.users.length ?? "--",
          caption: "People who can sign in to this SysAtlas workspace.",
        }
      : null,
    canManageProfiles
      ? {
          label: "Profiles",
          value: accessControlQuery.data?.profiles.length ?? "--",
          caption: "Reusable access profiles for roles and permissions.",
        }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: string | number; caption: string }>;

  const quickLinks = [
    canViewLibraries
      ? {
          to: withDevMode("/libraries"),
          label: "Libraries",
          description: "Review connected SharePoint and Teams library sources.",
        }
      : null,
    canViewUsers
      ? {
          to: withDevMode("/users"),
          label: "Users",
          description: "Work from the synced organization user inventory.",
        }
      : null,
    canViewDevices
      ? {
          to: withDevMode("/devices"),
          label: "Devices",
          description: "Review the managed device inventory in one place.",
        }
      : null,
    canManageProfiles
      ? {
          to: withDevMode("/settings/profiles"),
          label: "Profiles",
          description: "Define access profiles for SysAtlas sign-in accounts.",
        }
      : null,
    canManageAccessUsers
      ? {
          to: withDevMode("/settings/users"),
          label: "Access Users",
          description: "Manage the people who can log in to this platform.",
        }
      : null,
    canManageIntegrations
      ? {
          to: withDevMode("/settings/integrations"),
          label: "Integrations",
          description: "Launch SharePoint, Teams, and other provider sessions.",
        }
      : null,
  ].filter(Boolean) as Array<{ to: string; label: string; description: string }>;

  return (
    <div className="d-grid gap-4">
      <CRow className="g-4" xs={{ cols: 1 }} md={{ cols: 2 }} xl={{ cols: 4 }}>
        {snapshotCards.map((card) => (
          <CCol key={card.label}>
            <StatCard label={card.label} value={card.value} caption={card.caption} />
          </CCol>
        ))}
      </CRow>

      <CCard className="shadow-sm">
        <CCardHeader className="d-flex flex-wrap align-items-start justify-content-between gap-3">
          <div>
            <p className="mb-1 fw-semibold">Workspace Areas</p>
            <p className="mb-0 text-body-secondary">
              Use Home for the summary, then jump straight into the area you need.
            </p>
          </div>
          <CBadge color="secondary">{quickLinks.length} available</CBadge>
        </CCardHeader>
        <CCardBody>
          <CRow className="g-4" xs={{ cols: 1 }} md={{ cols: 2 }} xl={{ cols: 3 }}>
            {quickLinks.map((item) => (
              <CCol key={item.to}>
                <Link to={item.to} className="text-decoration-none text-reset">
                  <CCard className="h-100">
                    <CCardBody>
                      <p className="mb-2 fw-semibold">{item.label}</p>
                      <p className="mb-0 text-body-secondary">{item.description}</p>
                    </CCardBody>
                  </CCard>
                </Link>
              </CCol>
            ))}
          </CRow>
        </CCardBody>
      </CCard>
    </div>
  );
}
