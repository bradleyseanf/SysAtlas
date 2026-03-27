import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { EmptyState } from "../../components/EmptyState";
import { PageHeader } from "../../components/PageHeader";
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
      <PageHeader
        eyebrow="Users Module"
        title="Directory-backed people inventory"
        description="Track user records, lifecycle state, and readiness for onboarding or offboarding workflows. When no source system is connected, SysAtlas pushes the operator directly to the relevant integration flow."
        actions={
          <button
            type="button"
            onClick={() => navigate("/integrations?module=users")}
            className="rounded-2xl border border-[#df6f87]/35 bg-[#c73e59] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#d55472]"
          >
            Integrate Now
          </button>
        }
      />

      {usersQuery.isLoading ? (
        <section className="rounded-[28px] border border-white/10 bg-[rgba(29,16,21,0.76)] px-5 py-12 text-center text-sm text-[#f3dce1]/72 backdrop-blur-[12px]">
          Loading user inventory...
        </section>
      ) : usersQuery.isError ? (
        <section className="rounded-[28px] border border-[#d55472]/30 bg-[rgba(123,30,52,0.18)] px-5 py-5 text-sm leading-6 text-[#fde6eb]">
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
            <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[rgba(29,16,21,0.76)] shadow-[0_22px_50px_rgba(8,4,6,0.28)] backdrop-blur-[12px]">
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <div>
                  <p className="text-sm font-semibold text-[#fff7f8]">All Users</p>
                  <p className="mt-1 text-sm text-[#f3dce1]/72">
                    Sources: {data.source_status.configured_sources.map((source) => source.name).join(", ")}
                  </p>
                </div>
                <span className="rounded-full border border-[#df6f87]/25 bg-[rgba(215,84,114,0.12)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#f2c8d1]">
                  {data.items.length} records
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left">
                  <thead className="bg-[rgba(255,255,255,0.04)] text-[0.74rem] font-semibold uppercase tracking-[0.18em] text-[#d2bac0]">
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
                      <tr key={item.id} className="border-t border-white/6 align-top text-sm text-[#f0dde1]/82">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-[#fff7f8]">{item.display_name}</p>
                          <p className="mt-1 text-[#f3dce1]/72">{item.email}</p>
                          <p className="mt-2 text-xs uppercase tracking-[0.12em] text-[#b88a95]">{item.title ?? "No title"}</p>
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
