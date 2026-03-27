import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { EmptyState } from "../../components/EmptyState";
import { StatusBadge } from "../../components/StatusBadge";
import { api } from "../../lib/api";
import { hasPermission, settingsRoutePermissions } from "../../lib/access";
import { useDevModeUrlState } from "../../lib/devMode";
import { formatDateTime } from "../../lib/formatters";
import { getTestUsersResponse } from "../../tests/inventoryFixtures";
import { useAuth } from "../auth/AuthContext";

function lifecycleTone(lifecycle: string) {
  if (lifecycle === "offboarding") {
    return "warning" as const;
  }

  if (lifecycle === "active") {
    return "positive" as const;
  }

  return "neutral" as const;
}

function accountTone(status: string) {
  if (status === "active") {
    return "positive" as const;
  }

  return "danger" as const;
}

export function UsersPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { isDevMode, withDevMode } = useDevModeUrlState();
  const usersQuery = useQuery({
    queryKey: ["users", isDevMode ? "dev" : "live"],
    queryFn: () => (isDevMode ? Promise.resolve(getTestUsersResponse()) : api.getUsers()),
  });

  const data = usersQuery.data;
  const canManageIntegrations = session ? hasPermission(session.user, settingsRoutePermissions.integrations) : false;

  return (
    <div className="space-y-6">
      {canManageIntegrations && !isDevMode ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => navigate(withDevMode("/settings/integrations?module=users"))}
            className="atlas-primary-button rounded-2xl px-4 py-2.5 text-sm font-semibold"
          >
            Integrate Now
          </button>
        </div>
      ) : null}

      {usersQuery.isLoading ? (
        <section className="atlas-panel rounded-[28px] px-5 py-12 text-center text-sm text-atlas-muted">
          Loading user inventory...
        </section>
      ) : usersQuery.isError ? (
        <section className="atlas-error rounded-[28px] px-5 py-5 text-sm leading-6">
          {usersQuery.error instanceof Error ? usersQuery.error.message : "Unable to load the users module."}
        </section>
      ) : data ? (
        data.items.length === 0 ? (
          <EmptyState
            title={data.source_status.has_configured_source ? "No synced users yet" : "No integration setup yet"}
            description={data.source_status.empty_state_message}
            actionLabel={canManageIntegrations ? "Integrate Now" : "Refresh"}
            onAction={() => (canManageIntegrations ? navigate(withDevMode("/settings/integrations?module=users")) : void usersQuery.refetch())}
          />
        ) : (
          <section className="atlas-panel overflow-hidden rounded-[28px]">
            <div className="flex items-center justify-between border-b border-[rgba(23,32,42,0.08)] px-6 py-4">
              <div>
                <p className="text-sm font-semibold text-atlas">All Users</p>
                <p className="mt-1 text-sm text-atlas-muted">
                  Sources: {data.source_status.configured_sources.map((source) => source.name).join(", ")}
                </p>
              </div>
              <span className="atlas-pill rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
                {data.items.length} records
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left">
                <thead className="atlas-table-head text-[0.74rem] font-semibold uppercase tracking-[0.18em]">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Source</th>
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4">Devices</th>
                    <th className="px-6 py-4">Lifecycle</th>
                    <th className="px-6 py-4">Account</th>
                    <th className="px-6 py-4">Last Activity</th>
                    <th className="px-6 py-4">Last Sync</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item) => (
                    <tr key={item.id} className="atlas-table-row border-t border-[rgba(23,32,42,0.06)] align-top text-sm">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-atlas">{item.display_name}</p>
                        <p className="mt-1 text-atlas-muted">{item.email}</p>
                        <p className="mt-2 text-xs uppercase tracking-[0.12em] text-atlas-dim">{item.title ?? "No title"}</p>
                      </td>
                      <td className="px-6 py-4">{item.source_provider}</td>
                      <td className="px-6 py-4">{item.department ?? "Not assigned"}</td>
                      <td className="px-6 py-4">{item.device_count}</td>
                      <td className="px-6 py-4">
                        <StatusBadge label={item.lifecycle_state} tone={lifecycleTone(item.lifecycle_state)} />
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge label={item.account_status} tone={accountTone(item.account_status)} />
                      </td>
                      <td className="px-6 py-4">{formatDateTime(item.last_activity_at)}</td>
                      <td className="px-6 py-4">{formatDateTime(item.last_synced_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )
      ) : null}
    </div>
  );
}
