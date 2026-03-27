import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { api, ApiError } from "../lib/api";
import { AccessPortal } from "../features/auth/AccessPortal";
import { useAuth } from "../features/auth/AuthContext";
import { AppShell } from "../features/layout/AppShell";
import { UsersPage } from "../features/users/UsersPage";
import { DevicesPage } from "../features/devices/DevicesPage";
import { IntegrationsPage } from "../features/integrations/IntegrationsPage";

export function AppRouter() {
  const { session, signOut } = useAuth();
  const setupStatusQuery = useQuery({
    queryKey: ["auth", "setup-status"],
    queryFn: api.getSetupStatus,
  });

  useEffect(() => {
    if (!session) {
      return;
    }

    const error = setupStatusQuery.error;
    if (error instanceof ApiError && error.status === 401) {
      signOut();
    }
  }, [session, setupStatusQuery.error, signOut]);

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
