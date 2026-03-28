import { CBadge, CCard, CCardBody } from "@coreui/react";
import { Navigate, NavLink, Outlet } from "react-router-dom";

import { accessibleSettingsNavigation, defaultAuthorizedRoute } from "../../lib/access";
import { useDevModeUrlState } from "../../lib/devMode";
import { useAuth } from "../auth/AuthContext";

export function SettingsLayout() {
  const { session } = useAuth();
  const { withDevMode } = useDevModeUrlState();

  if (!session) {
    return null;
  }

  const visibleTabs = accessibleSettingsNavigation(session.user);
  if (!visibleTabs.length) {
    return <Navigate to={withDevMode(defaultAuthorizedRoute(session.user))} replace />;
  }

  return (
    <div className="d-grid gap-4">
      <CCard className="shadow-sm">
        <CCardBody className="d-flex flex-wrap align-items-start justify-content-between gap-3">
          <div>
            <p className="mb-2 small fw-semibold text-body-secondary text-uppercase">Workspace Controls</p>
            <h1 className="h3 mb-2">Settings</h1>
            <p className="mb-0 text-body-secondary">
              Manage access profiles, admin sign-in accounts, and provider connections from one place.
            </p>
          </div>
          <CBadge color="secondary">{visibleTabs.length} areas available</CBadge>
        </CCardBody>
      </CCard>

      <div className="d-flex flex-wrap gap-2">
        {visibleTabs.map((item) => (
          <NavLink
            key={item.to}
            to={withDevMode(item.to)}
            className={({ isActive }) => `btn ${isActive ? "btn-primary" : "btn-outline-secondary"}`}
          >
            {item.label}
          </NavLink>
        ))}
      </div>

      <Outlet />
    </div>
  );
}
