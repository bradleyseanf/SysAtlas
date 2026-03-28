import type { ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CSpinner } from "@coreui/react";

import { api } from "../lib/api";
import { defaultAuthorizedRoute, defaultSettingsRoute, hasPermission, settingsRoutePermissions, moduleRoutePermissions } from "../lib/access";
import { withDevModeSearch } from "../lib/devMode";
import { AccessPortal } from "../features/auth/AccessPortal";
import { useAuth } from "../features/auth/AuthContext";
import { HomePage } from "../features/home/HomePage";
import { AppShell } from "../features/layout/AppShell";
import { LibrariesPage } from "../features/libraries/LibrariesPage";
import { SettingsLayout } from "../features/settings/SettingsLayout";
import { ProfilesPage } from "../features/settings/ProfilesPage";
import { AccessUsersPage } from "../features/settings/AccessUsersPage";
import { ProfileDetailPage } from "../features/settings/ProfileDetailPage";
import { AccessUserDetailPage } from "../features/settings/AccessUserDetailPage";
import { UsersPage } from "../features/users/UsersPage";
import { DevicesPage } from "../features/devices/DevicesPage";
import { IntegrationsPage } from "../features/integrations/IntegrationsPage";

function RequirePermission({
  allowed,
  children,
}: {
  allowed: boolean;
  children: ReactNode;
}) {
  const { session } = useAuth();
  const location = useLocation();

  if (!session) {
    return null;
  }

  return allowed ? children : <Navigate to={withDevModeSearch(defaultAuthorizedRoute(session.user), location.search)} replace />;
}

export function AppRouter() {
  const { isReady, session } = useAuth();
  const location = useLocation();
  const setupStatusQuery = useQuery({
    queryKey: ["auth", "setup-status"],
    queryFn: api.getSetupStatus,
  });

  if (!isReady) {
    return (
      <div className="d-flex min-vh-100 flex-column align-items-center justify-content-center gap-3 px-4 text-center text-body-secondary">
        <CSpinner color="primary" />
        <span className="small">Restoring your secure session...</span>
      </div>
    );
  }

  if (!session) {
    return (
      <AccessPortal
        setupStatus={setupStatusQuery.data ?? null}
        isLoading={setupStatusQuery.isLoading}
        error={setupStatusQuery.error instanceof Error ? setupStatusQuery.error.message : ""}
      />
    );
  }

  const fallbackRoute = withDevModeSearch(defaultAuthorizedRoute(session.user), location.search);
  const fallbackSettingsRoute = withDevModeSearch(
    defaultSettingsRoute(session.user) ?? defaultAuthorizedRoute(session.user),
    location.search,
  );

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to={fallbackRoute} replace />} />
        <Route path="/home" element={<HomePage />} />
        <Route
          path="/libraries"
          element={
            <RequirePermission allowed={hasPermission(session.user, moduleRoutePermissions.libraries)}>
              <LibrariesPage />
            </RequirePermission>
          }
        />
        <Route
          path="/users"
          element={
            <RequirePermission allowed={hasPermission(session.user, moduleRoutePermissions.users)}>
              <UsersPage />
            </RequirePermission>
          }
        />
        <Route
          path="/devices"
          element={
            <RequirePermission allowed={hasPermission(session.user, moduleRoutePermissions.devices)}>
              <DevicesPage />
            </RequirePermission>
          }
        />
        <Route
          path="/settings"
          element={
            <RequirePermission
              allowed={
                hasPermission(session.user, settingsRoutePermissions.profiles) ||
                hasPermission(session.user, settingsRoutePermissions.users) ||
                hasPermission(session.user, settingsRoutePermissions.integrations)
              }
            >
              <SettingsLayout />
            </RequirePermission>
          }
        >
          <Route index element={<Navigate to={fallbackSettingsRoute} replace />} />
          <Route
            path="profiles"
            element={
              <RequirePermission allowed={hasPermission(session.user, settingsRoutePermissions.profiles)}>
                <ProfilesPage />
              </RequirePermission>
            }
          />
          <Route
            path="profiles/:profileId"
            element={
              <RequirePermission allowed={hasPermission(session.user, settingsRoutePermissions.profiles)}>
                <ProfileDetailPage />
              </RequirePermission>
            }
          />
          <Route
            path="users"
            element={
              <RequirePermission allowed={hasPermission(session.user, settingsRoutePermissions.users)}>
                <AccessUsersPage />
              </RequirePermission>
            }
          />
          <Route
            path="users/:userId"
            element={
              <RequirePermission allowed={hasPermission(session.user, settingsRoutePermissions.users)}>
                <AccessUserDetailPage />
              </RequirePermission>
            }
          />
          <Route
            path="integrations"
            element={
              <RequirePermission allowed={hasPermission(session.user, settingsRoutePermissions.integrations)}>
                <IntegrationsPage />
              </RequirePermission>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to={fallbackRoute} replace />} />
      </Route>
    </Routes>
  );
}
