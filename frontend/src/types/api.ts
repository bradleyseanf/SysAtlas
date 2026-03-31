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
  profile: {
    id: string;
    name: string;
    description: string | null;
  } | null;
  permissions: string[];
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
  setup_mode: string;
  launch_url: string;
  documentation_url: string | null;
  launch_button_label: string;
  setup_steps: string[];
  security_notes: string[];
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

export type IntegrationOauthConfig = {
  provider: string;
  configured: boolean;
  source: "environment" | "database" | "missing";
  redirect_uri: string;
  client_id_hint: string | null;
};

export type IntegrationOauthConfigPayload = {
  client_id: string;
  client_secret: string;
  redirect_uri: string;
};

export type IntegrationImportResponse = {
  message: string;
  imported_count: number;
  updated_count: number;
  total_count: number;
};

export type LibraryNode = {
  id: string;
  name: string;
  node_type: string;
  path: string;
  stage_status: string;
  source: string;
  staged_item_count: number;
  security_profiles: string[];
  owner: string | null;
  notes: string | null;
  last_synced_at: string | null;
  children: LibraryNode[];
};

export type LibraryListResponse = {
  items: LibraryNode[];
  stats: {
    total_sites: number;
    staged_nodes: number;
    secured_nodes: number;
    referenced_profiles: number;
  };
};

export type PermissionDefinition = {
  key: string;
  label: string;
  description: string;
  group: string;
};

export type AccessProfileSummary = {
  id: string;
  name: string;
  description: string | null;
};

export type AccessProfile = {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  is_system_profile: boolean;
  assigned_user_count: number;
  created_at: string;
  updated_at: string;
};

export type AccessUser = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  profile: AccessProfileSummary | null;
  permissions: string[];
  created_at: string;
  updated_at: string;
};

export type AccessControlResponse = {
  permissions: PermissionDefinition[];
  profiles: AccessProfile[];
  users: AccessUser[];
};

export type AccessProfileUpsertPayload = {
  id?: string;
  name: string;
  description: string;
  permissions: string[];
};

export type AccessProfileMutationResponse = {
  message: string;
  item: AccessProfile;
};

export type AccessUserUpsertPayload = {
  id?: string;
  first_name: string;
  last_name: string;
  email: string;
  password?: string;
  profile_id?: string | null;
  is_active: boolean;
  is_superuser: boolean;
};

export type AccessUserMutationResponse = {
  message: string;
  item: AccessUser;
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
  created_at: string;
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
  created_at: string;
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
