import { useQuery } from "@tanstack/react-query";
import { CAlert, CBadge, CButton, CCard, CCardBody, CCardHeader, CSpinner, CTable } from "@coreui/react";
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
    <div className="d-grid gap-4">
      {canManageIntegrations && !isDevMode ? (
        <div className="d-flex justify-content-end">
          <CButton color="primary" onClick={() => navigate(withDevMode("/settings/integrations?module=devices"))}>
            Integrate Now
          </CButton>
        </div>
      ) : null}

      {devicesQuery.isLoading ? (
        <CCard className="shadow-sm">
          <CCardBody className="py-5 text-center text-body-secondary">
            <CSpinner color="primary" className="mb-3" />
            <div>Loading device inventory...</div>
          </CCardBody>
        </CCard>
      ) : devicesQuery.isError ? (
        <CAlert color="danger" className="mb-0">
          {devicesQuery.error instanceof Error ? devicesQuery.error.message : "Unable to load the devices module."}
        </CAlert>
      ) : data ? (
        data.items.length === 0 ? (
          <EmptyState
            title={data.source_status.has_configured_source ? "No synced devices yet" : "No integration setup yet"}
            description={data.source_status.empty_state_message}
            actionLabel={canManageIntegrations ? "Integrate Now" : "Refresh"}
            onAction={() => (canManageIntegrations ? navigate(withDevMode("/settings/integrations?module=devices")) : void devicesQuery.refetch())}
          />
        ) : (
          <CCard className="shadow-sm">
            <CCardHeader className="d-flex flex-wrap align-items-start justify-content-between gap-3">
              <div>
                <p className="mb-1 fw-semibold">All Devices</p>
                <p className="mb-0 text-body-secondary">
                  Sources: {data.source_status.configured_sources.map((source) => source.name).join(", ")}
                </p>
              </div>
              <div className="d-flex flex-wrap gap-2">
                <CBadge color="secondary">{data.items.length} records</CBadge>
                {isDevMode ? <CBadge color="warning">Test Data</CBadge> : null}
              </div>
            </CCardHeader>

            <CCardBody className="p-0">
              <CTable hover responsive className="mb-0">
                <thead>
                  <tr>
                    <th>Device</th>
                    <th>Source</th>
                    <th>Ownership</th>
                    <th>Compliance</th>
                    <th>Management</th>
                    <th>Primary User</th>
                    <th>Last Check-In</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="fw-semibold">{item.device_name}</div>
                        <div className="text-body-secondary">
                          {item.platform}
                          {item.manufacturer || item.model ? ` - ${[item.manufacturer, item.model].filter(Boolean).join(" ")}` : ""}
                        </div>
                        <div className="small text-body-secondary text-uppercase">{item.serial_number ?? "No serial recorded"}</div>
                      </td>
                      <td>{item.source_provider}</td>
                      <td>{item.ownership}</td>
                      <td>
                        <StatusBadge label={item.compliance_state} tone={complianceTone(item.compliance_state)} />
                      </td>
                      <td>{item.management_state}</td>
                      <td>{item.primary_user_email ?? "Unassigned"}</td>
                      <td>{formatDateTime(item.last_check_in_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </CTable>
            </CCardBody>
          </CCard>
        )
      ) : null}
    </div>
  );
}
