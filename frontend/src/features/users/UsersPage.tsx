import { useQuery } from "@tanstack/react-query";
import { CAlert, CBadge, CButton, CCard, CCardBody, CCardHeader, CSpinner, CTable } from "@coreui/react";
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
    <div className="d-grid gap-4">
      {canManageIntegrations && !isDevMode ? (
        <div className="d-flex justify-content-end">
          <CButton color="primary" onClick={() => navigate(withDevMode("/settings/integrations?module=users"))}>
            Integrate Now
          </CButton>
        </div>
      ) : null}

      {usersQuery.isLoading ? (
        <CCard className="shadow-sm">
          <CCardBody className="py-5 text-center text-body-secondary">
            <CSpinner color="primary" className="mb-3" />
            <div>Loading user inventory...</div>
          </CCardBody>
        </CCard>
      ) : usersQuery.isError ? (
        <CAlert color="danger" className="mb-0">
          {usersQuery.error instanceof Error ? usersQuery.error.message : "Unable to load the users module."}
        </CAlert>
      ) : data ? (
        data.items.length === 0 ? (
          <EmptyState
            title={data.source_status.has_configured_source ? "No synced users yet" : "No integration setup yet"}
            description={data.source_status.empty_state_message}
            actionLabel={canManageIntegrations ? "Integrate Now" : "Refresh"}
            onAction={() => (canManageIntegrations ? navigate(withDevMode("/settings/integrations?module=users")) : void usersQuery.refetch())}
          />
        ) : (
          <CCard className="shadow-sm">
            <CCardHeader className="d-flex flex-wrap align-items-start justify-content-between gap-3">
              <div>
                <p className="mb-1 fw-semibold">All Users</p>
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
                    <th>User</th>
                    <th>Source</th>
                    <th>Department</th>
                    <th>Devices</th>
                    <th>Lifecycle</th>
                    <th>Account</th>
                    <th>Last Activity</th>
                    <th>Last Sync</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className="fw-semibold">{item.display_name}</div>
                        <div className="text-body-secondary">{item.email}</div>
                        <div className="small text-body-secondary text-uppercase">{item.title ?? "No title"}</div>
                      </td>
                      <td>{item.source_provider}</td>
                      <td>{item.department ?? "Not assigned"}</td>
                      <td>{item.device_count}</td>
                      <td>
                        <StatusBadge label={item.lifecycle_state} tone={lifecycleTone(item.lifecycle_state)} />
                      </td>
                      <td>
                        <StatusBadge label={item.account_status} tone={accountTone(item.account_status)} />
                      </td>
                      <td>{formatDateTime(item.last_activity_at)}</td>
                      <td>{formatDateTime(item.last_synced_at)}</td>
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
