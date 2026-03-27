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
    <div className="space-y-5">
      <section className="atlas-panel-strong rounded-[30px] px-6 py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-atlas-accent-soft text-[0.74rem] font-semibold uppercase tracking-[0.18em]">
              Workspace Controls
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-atlas">Settings</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-atlas-muted">
              Manage access profiles, admin sign-in accounts, and provider connections from one place.
            </p>
          </div>
          <div className="atlas-pill rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em]">
            {visibleTabs.length} areas available
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        {visibleTabs.map((item) => (
          <NavLink
            key={item.to}
            to={withDevMode(item.to)}
            className={({ isActive }) =>
              `rounded-full px-4 py-2 text-sm font-semibold transition ${
                isActive ? "atlas-pill-accent" : "atlas-secondary-button text-atlas-soft"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>

      <Outlet />
    </div>
  );
}
