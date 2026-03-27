import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { EmptyState } from "../../components/EmptyState";
import { StatCard } from "../../components/StatCard";
import { StatusBadge } from "../../components/StatusBadge";
import { api } from "../../lib/api";
import { formatDateTime } from "../../lib/formatters";

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
  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: api.getUsers,
  });

  const data = usersQuery.data;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => navigate("/integrations?module=users")}
          className="atlas-primary-button rounded-2xl px-4 py-2.5 text-sm font-semibold"
        >
          Integrate Now
        </button>
      </div>

      {usersQuery.isLoading ? (
        <section className="atlas-panel rounded-[28px] px-5 py-12 text-center text-sm text-atlas-muted">
          Loading user inventory...
        </section>
      ) : usersQuery.isError ? (
        <section className="atlas-error rounded-[28px] px-5 py-5 text-sm leading-6">
          {usersQuery.error instanceof Error ? usersQuery.error.message : "Unable to load the users module."}
        </section>
      ) : data ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Users" value={data.stats.total_users} caption="User records currently indexed in SysAtlas." />
            <StatCard label="Active Accounts" value={data.stats.active_users} caption="Users currently marked active in the inventory." />
            <StatCard label="Offboarding" value={data.stats.offboarding_users} caption="Accounts flagged as in an offboarding lifecycle." />
            <StatCard label="Connected Sources" value={data.stats.connected_sources} caption="Configured user-capable integrations." />
          </div>

          {data.items.length === 0 ? (
            <EmptyState
              title={data.source_status.has_configured_source ? "No synced users yet" : "No integration setup yet"}
              description={data.source_status.empty_state_message}
              actionLabel="Integrate Now"
              onAction={() => navigate("/integrations?module=users")}
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
          )}
        </>
      ) : null}
    </div>
  );
}
