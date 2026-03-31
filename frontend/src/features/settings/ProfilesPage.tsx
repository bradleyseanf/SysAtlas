import { CAlert, CBadge, CButton, CCard, CCardBody, CCardHeader, CSpinner, CTable } from "@coreui/react";
import { useNavigate } from "react-router-dom";

import { StatusBadge } from "../../components/StatusBadge";
import { useDevModeUrlState } from "../../lib/devMode";
import { formatDateTime } from "../../lib/formatters";
import { isHostedStaticDemoMode } from "../../lib/runtimeMode";
import { NEW_PROFILE_ROUTE_ID, useAccessControlState } from "./accessControlShared";

export function ProfilesPage() {
  const isStaticDemo = isHostedStaticDemoMode();
  const navigate = useNavigate();
  const { withDevMode } = useDevModeUrlState();
  const accessControlQuery = useAccessControlState();
  const profiles = accessControlQuery.data?.profiles ?? [];

  return (
    <div className="d-grid gap-4">
      <CAlert color="info" className="mb-0">
        {isStaticDemo
          ? "Hosted Vercel access is read-only. Profiles shown here come from static demo data."
          : "Profiles are reusable access templates. Open a profile to manage its permissions and the users assigned to it."}
      </CAlert>

      {accessControlQuery.isLoading ? (
        <CCard className="shadow-sm">
          <CCardBody className="py-5 text-center text-body-secondary">
            <CSpinner color="primary" className="mb-3" />
            <div>Loading access profiles...</div>
          </CCardBody>
        </CCard>
      ) : accessControlQuery.isError ? (
        <CAlert color="danger" className="mb-0">
          {accessControlQuery.error instanceof Error ? accessControlQuery.error.message : "Unable to load the access profiles."}
        </CAlert>
      ) : (
        <CCard className="shadow-sm">
          <CCardHeader className="d-flex flex-wrap align-items-start justify-content-between gap-3">
            <div>
              <p className="mb-1 fw-semibold">Access Profiles</p>
              <p className="mb-0 text-body-secondary">Open a profile to manage what it can and cannot do.</p>
            </div>
            <div className="d-flex flex-wrap gap-2">
              <CBadge color="secondary">{profiles.length} records</CBadge>
              <CButton color="primary" disabled={isStaticDemo} onClick={() => navigate(withDevMode(`/settings/profiles/${NEW_PROFILE_ROUTE_ID}`))}>
                New Profile
              </CButton>
            </div>
          </CCardHeader>

          <CCardBody className="p-0">
            <CTable hover responsive className="mb-0">
              <thead>
                <tr>
                  <th>Profile</th>
                  <th>Type</th>
                  <th>Assigned Users</th>
                  <th>Permissions</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((profile) => (
                  <tr key={profile.id}>
                    <td>
                      <CButton
                        color="link"
                        className="p-0 text-start text-decoration-none fw-semibold"
                        onClick={() => navigate(withDevMode(`/settings/profiles/${profile.id}`))}
                      >
                        {profile.name}
                      </CButton>
                    </td>
                    <td>
                      {profile.is_system_profile ? (
                        <StatusBadge label="Locked" tone="info" />
                      ) : (
                        <CBadge color="light" textColor="dark">
                          Custom
                        </CBadge>
                      )}
                    </td>
                    <td>{profile.assigned_user_count}</td>
                    <td>{profile.permissions.length}</td>
                    <td>{formatDateTime(profile.updated_at)}</td>
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
