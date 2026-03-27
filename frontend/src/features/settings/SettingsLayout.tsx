import { Navigate, NavLink, Outlet } from "react-router-dom";

import { accessibleSettingsNavigation, defaultAuthorizedRoute } from "../../lib/access";
import { useAuth } from "../auth/AuthContext";

export function SettingsLayout() {
  const { session } = useAuth();

  if (!session) {
    return null;
  }

  const visibleTabs = accessibleSettingsNavigation(session.user);
  if (!visibleTabs.length) {
    return <Navigate to={defaultAuthorizedRoute(session.user)} replace />;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3">
        {visibleTabs.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
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
