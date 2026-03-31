import type {
  AccessControlResponse,
  AccessProfileMutationResponse,
  AccessProfileUpsertPayload,
  AccessUserMutationResponse,
  AccessUserUpsertPayload,
  AuthResponse,
  AuthSessionResponse,
  DeviceListResponse,
  IntegrationCatalogResponse,
  IntegrationImportResponse,
  IntegrationListResponse,
  IntegrationMutationResponse,
  IntegrationOauthConfig,
  IntegrationOauthConfigPayload,
  IntegrationUpsertPayload,
  LibraryListResponse,
  SetupStatus,
  UserListResponse,
} from "../types/api";
import {
  getStaticDemoAccessControl,
  getStaticDemoAuthResponse,
  getStaticDemoIntegrationCatalog,
  getStaticDemoIntegrationConnections,
  getStaticDemoLibraries,
  getStaticDemoSession,
  getStaticDemoSetupStatus,
} from "../tests/staticDemo";
import { getTestDevicesResponse, getTestUsersResponse } from "../tests/inventoryFixtures";
import { isHostedStaticDemoMode } from "./runtimeMode";

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1").replace(/\/$/, "");
const STATIC_DEMO_WRITE_BLOCK_MESSAGE = "Static demo mode is active on the hosted Vercel site. Connect the backend locally to use live data.";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  if (isHostedStaticDemoMode()) {
    return staticDemoApiRequest<T>(path, init);
  }

  const response = await fetch(buildApiUrl(path), {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json().catch(() => null)) as { detail?: string } | null;
  if (!response.ok) {
    throw new ApiError(payload?.detail ?? "The request could not be completed.", response.status);
  }

  return payload as T;
}

async function staticDemoApiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? "GET").toUpperCase();

  if (method !== "GET") {
    if (path === "/auth/logout") {
      return undefined as T;
    }

    if (path === "/auth/bootstrap") {
      return getStaticDemoAuthResponse("Static demo mode is active.") as T;
    }

    if (path === "/auth/login") {
      return getStaticDemoAuthResponse("Static demo mode is active.") as T;
    }

    throw new ApiError(STATIC_DEMO_WRITE_BLOCK_MESSAGE, 403);
  }

  switch (path) {
    case "/auth/setup-status":
      return getStaticDemoSetupStatus() as T;
    case "/auth/session":
      return getStaticDemoSession() as T;
    case "/libraries":
      return getStaticDemoLibraries() as T;
    case "/users":
      return getTestUsersResponse() as T;
    case "/devices":
      return getTestDevicesResponse() as T;
    case "/integrations/catalog":
      return getStaticDemoIntegrationCatalog() as T;
    case "/integrations":
      return getStaticDemoIntegrationConnections() as T;
    case "/settings/access-control":
      return getStaticDemoAccessControl() as T;
    default:
      if (path.startsWith("/integrations/") && path.endsWith("/oauth/config")) {
        const provider = path.split("/")[2] ?? "provider";

        return {
          provider,
          configured: true,
          source: "missing",
          redirect_uri: "https://sys-atlas.vercel.app/",
          client_id_hint: "Hosted static demo",
        } as T;
      }

      throw new ApiError("Static demo data is not available for this request.", 404);
  }
}

export function buildApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export const api = {
  getSetupStatus: () => apiRequest<SetupStatus>("/auth/setup-status"),
  getCurrentSession: () => apiRequest<AuthSessionResponse>("/auth/session"),
  bootstrap: (payload: { first_name: string; last_name: string; email: string; password: string }) =>
    apiRequest<AuthResponse>("/auth/bootstrap", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  login: (payload: { email: string; password: string }) =>
    apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  logout: () =>
    apiRequest<void>("/auth/logout", {
      method: "POST",
    }),
  getLibraries: () => apiRequest<LibraryListResponse>("/libraries"),
  getUsers: () => apiRequest<UserListResponse>("/users"),
  getDevices: () => apiRequest<DeviceListResponse>("/devices"),
  getIntegrationCatalog: () => apiRequest<IntegrationCatalogResponse>("/integrations/catalog"),
  getIntegrations: () => apiRequest<IntegrationListResponse>("/integrations"),
  saveIntegration: (payload: IntegrationUpsertPayload) =>
    apiRequest<IntegrationMutationResponse>("/integrations", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getIntegrationOauthConfig: (provider: string) => apiRequest<IntegrationOauthConfig>(`/integrations/${provider}/oauth/config`),
  saveIntegrationOauthConfig: (provider: string, payload: IntegrationOauthConfigPayload) =>
    apiRequest<IntegrationOauthConfig>(`/integrations/${provider}/oauth/config`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  importIntegrationDevices: (provider: string) =>
    apiRequest<IntegrationImportResponse>(`/integrations/${provider}/import/devices`, {
      method: "POST",
    }),
  getAccessControl: () => apiRequest<AccessControlResponse>("/settings/access-control"),
  saveAccessProfile: (payload: AccessProfileUpsertPayload) =>
    apiRequest<AccessProfileMutationResponse>("/settings/profiles", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  saveAccessUser: (payload: AccessUserUpsertPayload) =>
    apiRequest<AccessUserMutationResponse>("/settings/access-users", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
