import { Navigate, Route, Routes } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { api } from "../lib/api";
import { AccessPortal } from "../features/auth/AccessPortal";
import { useAuth } from "../features/auth/AuthContext";
import { AppShell } from "../features/layout/AppShell";
import { UsersPage } from "../features/users/UsersPage";
import { DevicesPage } from "../features/devices/DevicesPage";
import { IntegrationsPage } from "../features/integrations/IntegrationsPage";

export function AppRouter() {
  const { isReady, session } = useAuth();
  const setupStatusQuery = useQuery({
    queryKey: ["auth", "setup-status"],
    queryFn: api.getSetupStatus,
  });

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--atlas-bg)] px-6 text-center text-sm text-atlas-muted">
        Restoring your secure session...
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

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/users" replace />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/devices" element={<DevicesPage />} />
        <Route path="/integrations" element={<IntegrationsPage />} />
        <Route path="*" element={<Navigate to="/users" replace />} />
      </Route>
    </Routes>
  );
}
