import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { StatCard } from "../../components/StatCard";
import { api } from "../../lib/api";
import { hasPermission, moduleRoutePermissions, settingsRoutePermissions } from "../../lib/access";
import { useAuth } from "../auth/AuthContext";

function librarySourceCount(items: Array<{ children: Array<unknown> }>) {
  return items.reduce((count, item) => count + item.children.length, 0);
}

export function HomePage() {
  const { session } = useAuth();

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
    queryKey: ["users"],
    queryFn: api.getUsers,
    enabled: canViewUsers,
  });

  const devicesQuery = useQuery({
    queryKey: ["devices"],
    queryFn: api.getDevices,
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
          to: "/libraries",
          label: "Libraries",
          description: "Review connected SharePoint and Teams library sources.",
        }
      : null,
    canViewUsers
      ? {
          to: "/users",
          label: "Users",
          description: "Work from the synced organization user inventory.",
        }
      : null,
    canViewDevices
      ? {
          to: "/devices",
          label: "Devices",
          description: "Review the managed device inventory in one place.",
        }
      : null,
    canManageProfiles
      ? {
          to: "/settings/profiles",
          label: "Profiles",
          description: "Define access profiles for SysAtlas sign-in accounts.",
        }
      : null,
    canManageAccessUsers
      ? {
          to: "/settings/users",
          label: "Access Users",
          description: "Manage the people who can log in to this platform.",
        }
      : null,
    canManageIntegrations
      ? {
          to: "/settings/integrations",
          label: "Integrations",
          description: "Launch SharePoint, Teams, and other provider sessions.",
        }
      : null,
  ].filter(Boolean) as Array<{ to: string; label: string; description: string }>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {snapshotCards.map((card) => (
          <StatCard key={card.label} label={card.label} value={card.value} caption={card.caption} />
        ))}
      </div>

      <section className="atlas-panel rounded-[30px] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-atlas">Workspace Areas</p>
            <p className="mt-1 text-sm text-atlas-muted">Use Home for the summary, then jump straight into the area you need.</p>
          </div>
          <span className="atlas-pill rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
            {quickLinks.length} available
          </span>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {quickLinks.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-[24px] border border-[rgba(23,32,42,0.08)] bg-white/72 px-5 py-5 transition hover:border-[rgba(201,74,99,0.22)] hover:bg-white"
            >
              <p className="text-sm font-semibold text-atlas">{item.label}</p>
              <p className="mt-2 text-sm leading-6 text-atlas-muted">{item.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
