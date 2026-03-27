import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { EmptyState } from "../../components/EmptyState";
import { StatCard } from "../../components/StatCard";
import { StatusBadge } from "../../components/StatusBadge";
import { api } from "../../lib/api";
import { formatDateTime } from "../../lib/formatters";

function complianceTone(status: string) {
  if (status === "compliant") {
    return "positive" as const;
  }

  if (status === "unknown") {
    return "neutral" as const;
  }

  return "warning" as const;
}

export function DevicesPage() {
  const navigate = useNavigate();
  const devicesQuery = useQuery({
    queryKey: ["devices"],
    queryFn: api.getDevices,
  });

  const data = devicesQuery.data;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => navigate("/integrations?module=devices")}
          className="atlas-primary-button rounded-2xl px-4 py-2.5 text-sm font-semibold"
        >
          Integrate Now
        </button>
      </div>

      {devicesQuery.isLoading ? (
        <section className="atlas-panel rounded-[28px] px-5 py-12 text-center text-sm text-atlas-muted">
          Loading device inventory...
        </section>
      ) : devicesQuery.isError ? (
        <section className="atlas-error rounded-[28px] px-5 py-5 text-sm leading-6">
          {devicesQuery.error instanceof Error ? devicesQuery.error.message : "Unable to load the devices module."}
        </section>
      ) : data ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Devices" value={data.stats.total_devices} caption="Endpoints currently tracked by SysAtlas." />
            <StatCard label="Compliant" value={data.stats.compliant_devices} caption="Devices marked compliant by their management source." />
            <StatCard label="Action Required" value={data.stats.action_required_devices} caption="Devices that require remediation or review." />
            <StatCard label="Connected Sources" value={data.stats.connected_sources} caption="Configured device-capable integrations." />
          </div>

          {data.items.length === 0 ? (
            <EmptyState
              title={data.source_status.has_configured_source ? "No synced devices yet" : "No integration setup yet"}
              description={data.source_status.empty_state_message}
              actionLabel="Integrate Now"
              onAction={() => navigate("/integrations?module=devices")}
            />
          ) : (
            <section className="atlas-panel overflow-hidden rounded-[28px]">
              <div className="flex items-center justify-between border-b border-[rgba(23,32,42,0.08)] px-6 py-4">
                <div>
                  <p className="text-sm font-semibold text-atlas">All Devices</p>
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
                      <th className="px-6 py-4">Device</th>
                      <th className="px-6 py-4">Source</th>
                      <th className="px-6 py-4">Ownership</th>
                      <th className="px-6 py-4">Compliance</th>
                      <th className="px-6 py-4">Management</th>
                      <th className="px-6 py-4">Primary User</th>
                      <th className="px-6 py-4">Last Check-In</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((item) => (
                      <tr key={item.id} className="atlas-table-row border-t border-[rgba(23,32,42,0.06)] align-top text-sm">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-atlas">{item.device_name}</p>
                          <p className="mt-1 text-atlas-muted">
                            {item.platform}
                            {item.manufacturer || item.model ? ` · ${[item.manufacturer, item.model].filter(Boolean).join(" ")}` : ""}
                          </p>
                          <p className="mt-2 text-xs uppercase tracking-[0.12em] text-atlas-dim">{item.serial_number ?? "No serial recorded"}</p>
                        </td>
                        <td className="px-6 py-4">{item.source_provider}</td>
                        <td className="px-6 py-4">{item.ownership}</td>
                        <td className="px-6 py-4">
                          <StatusBadge label={item.compliance_state} tone={complianceTone(item.compliance_state)} />
                        </td>
                        <td className="px-6 py-4">{item.management_state}</td>
                        <td className="px-6 py-4">{item.primary_user_email ?? "Unassigned"}</td>
                        <td className="px-6 py-4">{formatDateTime(item.last_check_in_at)}</td>
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
