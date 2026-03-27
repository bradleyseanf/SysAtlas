import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { EmptyState } from "../../components/EmptyState";
import { StatusBadge } from "../../components/StatusBadge";
import { api } from "../../lib/api";
import { hasPermission, settingsRoutePermissions } from "../../lib/access";
import { useDevModeUrlState } from "../../lib/devMode";
import { formatDateTime } from "../../lib/formatters";
import { getTestDevicesResponse } from "../../tests/inventoryFixtures";
import { useAuth } from "../auth/AuthContext";

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
  const { session } = useAuth();
  const { isDevMode, withDevMode } = useDevModeUrlState();
  const devicesQuery = useQuery({
    queryKey: ["devices", isDevMode ? "dev" : "live"],
    queryFn: () => (isDevMode ? Promise.resolve(getTestDevicesResponse()) : api.getDevices()),
  });

  const data = devicesQuery.data;
  const canManageIntegrations = session ? hasPermission(session.user, settingsRoutePermissions.integrations) : false;

  return (
    <div className="space-y-6">
      {canManageIntegrations && !isDevMode ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => navigate(withDevMode("/settings/integrations?module=devices"))}
            className="atlas-primary-button rounded-2xl px-4 py-2.5 text-sm font-semibold"
          >
            Integrate Now
          </button>
        </div>
      ) : null}

      {devicesQuery.isLoading ? (
        <section className="atlas-panel rounded-[28px] px-5 py-12 text-center text-sm text-atlas-muted">
          Loading device inventory...
        </section>
      ) : devicesQuery.isError ? (
        <section className="atlas-error rounded-[28px] px-5 py-5 text-sm leading-6">
          {devicesQuery.error instanceof Error ? devicesQuery.error.message : "Unable to load the devices module."}
        </section>
      ) : data ? (
        data.items.length === 0 ? (
          <EmptyState
            title={data.source_status.has_configured_source ? "No synced devices yet" : "No integration setup yet"}
            description={data.source_status.empty_state_message}
            actionLabel={canManageIntegrations ? "Integrate Now" : "Refresh"}
            onAction={() => (canManageIntegrations ? navigate(withDevMode("/settings/integrations?module=devices")) : void devicesQuery.refetch())}
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
                          {item.manufacturer || item.model ? ` - ${[item.manufacturer, item.model].filter(Boolean).join(" ")}` : ""}
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
        )
      ) : null}
    </div>
  );
}
