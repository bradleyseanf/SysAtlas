import { CAlert, CBadge, CButton, CCard, CCardBody, CCardHeader, CSpinner, CTable } from "@coreui/react";
import { useNavigate } from "react-router-dom";

import { StatusBadge } from "../../components/StatusBadge";
import { useDevModeUrlState } from "../../lib/devMode";
import { formatDateTime } from "../../lib/formatters";
import { NEW_USER_ROUTE_ID, useAccessControlState } from "./accessControlShared";

export function AccessUsersPage() {
  const navigate = useNavigate();
  const { withDevMode } = useDevModeUrlState();
  const accessControlQuery = useAccessControlState();
  const users = accessControlQuery.data?.users ?? [];

  return (
    <div className="d-grid gap-4">
      <CAlert color="info" className="mb-0">
        These users are SysAtlas access accounts. Open a user to review their profile assignment and edit their sign-in details.
      </CAlert>

      {accessControlQuery.isLoading ? (
        <CCard className="shadow-sm">
          <CCardBody className="py-5 text-center text-body-secondary">
            <CSpinner color="primary" className="mb-3" />
            <div>Loading SysAtlas access users...</div>
          </CCardBody>
        </CCard>
      ) : accessControlQuery.isError ? (
        <CAlert color="danger" className="mb-0">
          {accessControlQuery.error instanceof Error ? accessControlQuery.error.message : "Unable to load SysAtlas access users."}
        </CAlert>
      ) : (
        <CCard className="shadow-sm">
          <CCardHeader className="d-flex flex-wrap align-items-start justify-content-between gap-3">
            <div>
              <p className="mb-1 fw-semibold">Access Users</p>
              <p className="mb-0 text-body-secondary">Open a user to edit their account in a dedicated detail view.</p>
            </div>
            <div className="d-flex flex-wrap gap-2">
              <CBadge color="secondary">{users.length} records</CBadge>
              <CButton color="primary" onClick={() => navigate(withDevMode(`/settings/users/${NEW_USER_ROUTE_ID}`))}>
                New User
              </CButton>
            </div>
          </CCardHeader>

          <CCardBody className="p-0">
            <CTable hover responsive className="mb-0">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Profile</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <CButton
                        color="link"
                        className="p-0 text-start text-decoration-none fw-semibold"
                        onClick={() => navigate(withDevMode(`/settings/users/${user.id}`))}
                      >
                        {user.display_name ?? user.email}
                      </CButton>
                    </td>
                    <td>{user.email}</td>
                    <td>{user.profile?.name ?? "No profile"}</td>
                    <td>
                      {user.is_superuser ? (
                        <StatusBadge label="Super Admin" tone="info" />
                      ) : (
                        <CBadge color="light" textColor="dark">
                          Standard
                        </CBadge>
                      )}
                    </td>
                    <td>
                      <StatusBadge label={user.is_active ? "Active" : "Disabled"} tone={user.is_active ? "positive" : "danger"} />
                    </td>
                    <td>{formatDateTime(user.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </CTable>
          </CCardBody>
        </CCard>
      )}
    </div>
  );
}
