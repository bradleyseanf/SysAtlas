import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { EmptyState } from "../../components/EmptyState";
import { PageHeader } from "../../components/PageHeader";
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
      <PageHeader
        eyebrow="Devices Module"
        title="Managed endpoint inventory"
        description="Centralize device inventory, ownership, compliance posture, and source-system visibility in one operational view. The module pushes operators into Intune or other device-source setup when inventory is still disconnected."
        actions={
          <button
            type="button"
            onClick={() => navigate("/integrations?module=devices")}
            className="rounded-2xl border border-[#df6f87]/35 bg-[#c73e59] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#d55472]"
          >
            Integrate Now
          </button>
        }
      />

      {devicesQuery.isLoading ? (
        <section className="rounded-[28px] border border-white/10 bg-[rgba(29,16,21,0.76)] px-5 py-12 text-center text-sm text-[#f3dce1]/72 backdrop-blur-[12px]">
          Loading device inventory...
        </section>
      ) : devicesQuery.isError ? (
        <section className="rounded-[28px] border border-[#d55472]/30 bg-[rgba(123,30,52,0.18)] px-5 py-5 text-sm leading-6 text-[#fde6eb]">
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
            <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[rgba(29,16,21,0.76)] shadow-[0_22px_50px_rgba(8,4,6,0.28)] backdrop-blur-[12px]">
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                <div>
                  <p className="text-sm font-semibold text-[#fff7f8]">All Devices</p>
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
                      <tr key={item.id} className="border-t border-white/6 align-top text-sm text-[#f0dde1]/82">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-[#fff7f8]">{item.device_name}</p>
                          <p className="mt-1 text-[#f3dce1]/72">
                            {item.platform}
                            {item.manufacturer || item.model ? ` · ${[item.manufacturer, item.model].filter(Boolean).join(" ")}` : ""}
                          </p>
                          <p className="mt-2 text-xs uppercase tracking-[0.12em] text-[#b88a95]">{item.serial_number ?? "No serial recorded"}</p>
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
