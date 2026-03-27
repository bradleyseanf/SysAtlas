import type {
  AuthResponse,
  DeviceListResponse,
  IntegrationCatalogResponse,
  IntegrationListResponse,
  IntegrationMutationResponse,
  IntegrationUpsertPayload,
  SetupStatus,
  UserListResponse,
} from "../types/api";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1").replace(/\/$/, "");

let accessToken: string | null = null;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function setApiAccessToken(token: string | null) {
  accessToken = token;
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json().catch(() => null)) as { detail?: string } | null;
  if (!response.ok) {
    throw new ApiError(payload?.detail ?? "The request could not be completed.", response.status);
  }

  return payload as T;
}

export const api = {
  getSetupStatus: () => apiRequest<SetupStatus>("/auth/setup-status"),
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
  getUsers: () => apiRequest<UserListResponse>("/users"),
  getDevices: () => apiRequest<DeviceListResponse>("/devices"),
  getIntegrationCatalog: () => apiRequest<IntegrationCatalogResponse>("/integrations/catalog"),
  getIntegrations: () => apiRequest<IntegrationListResponse>("/integrations"),
  saveIntegration: (payload: IntegrationUpsertPayload) =>
    apiRequest<IntegrationMutationResponse>("/integrations", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
