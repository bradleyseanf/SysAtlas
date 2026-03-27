export type SetupStatus = {
  setup_required: boolean;
  user_count: number;
};

export type AuthUser = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  role: string;
  created_at: string;
};

export type AuthResponse = {
  message: string;
  user: AuthUser;
};

export type AuthSessionResponse = {
  user: AuthUser;
};

export type IntegrationField = {
  key: string;
  label: string;
  input_type: "text" | "password" | "email" | "url" | "textarea";
  placeholder: string | null;
  help_text: string | null;
  required: boolean;
  secret: boolean;
};

export type IntegrationProvider = {
  id: string;
  name: string;
  category: string;
  description: string;
  auth_strategy: string;
  supported_modules: string[];
  fields: IntegrationField[];
};

export type IntegrationConnection = {
  id: string;
  provider: string;
  provider_name: string;
  category: string;
  description: string;
  tenant_label: string;
  auth_strategy: string;
  status: string;
  supported_modules: string[];
  configured_fields: string[];
  configured_secret_fields: string[];
  config_preview: Record<string, string>;
  scopes: string[] | null;
  created_at: string;
  updated_at: string;
};

export type IntegrationCatalogResponse = {
  providers: IntegrationProvider[];
};

export type IntegrationListResponse = {
  items: IntegrationConnection[];
};

export type IntegrationMutationResponse = {
  message: string;
  item: IntegrationConnection;
};

export type IntegrationOption = {
  id: string;
  name: string;
};

export type ModuleSourceStatus = {
  module: "users" | "devices";
  has_configured_source: boolean;
  configured_sources: IntegrationOption[];
  suggested_sources: IntegrationOption[];
  empty_state_message: string;
};

export type UserListItem = {
  id: string;
  display_name: string;
  email: string;
  source_provider: string;
  title: string | null;
  department: string | null;
  lifecycle_state: string;
  account_status: string;
  device_count: number;
  last_activity_at: string | null;
  last_synced_at: string | null;
};

export type UserListResponse = {
  items: UserListItem[];
  source_status: ModuleSourceStatus;
  stats: {
    total_users: number;
    active_users: number;
    offboarding_users: number;
    connected_sources: number;
  };
};

export type DeviceListItem = {
  id: string;
  device_name: string;
  platform: string;
  manufacturer: string | null;
  model: string | null;
  serial_number: string | null;
  source_provider: string;
  ownership: string;
  compliance_state: string;
  management_state: string;
  primary_user_email: string | null;
  lifecycle_state: string;
  last_check_in_at: string | null;
};

export type DeviceListResponse = {
  items: DeviceListItem[];
  source_status: ModuleSourceStatus;
  stats: {
    total_devices: number;
    compliant_devices: number;
    action_required_devices: number;
    connected_sources: number;
  };
};

export type IntegrationUpsertPayload = {
  provider: string;
  tenant_label: string;
  status?: string;
  config: Record<string, string>;
  scopes?: string[] | null;
};
