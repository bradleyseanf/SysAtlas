import type {
  AccessControlResponse,
  AuthResponse,
  AuthSessionResponse,
  AuthUser,
  IntegrationCatalogResponse,
  IntegrationListResponse,
  LibraryListResponse,
  SetupStatus,
} from "../types/api";

const timestamp = "2026-03-31T14:30:00Z";

const demoUser: AuthUser = {
  id: "demo-super-admin",
  first_name: "Atlas",
  last_name: "Operator",
  display_name: "Atlas Operator",
  email: "demo@sysatlas.dev",
  is_active: true,
  is_superuser: true,
  role: "super_admin",
  profile: {
    id: "profile-super-admin",
    name: "Super Admin",
    description: "Full access to the SysAtlas demo workspace.",
  },
  permissions: [
    "libraries.view",
    "users.view",
    "devices.view",
    "settings.profiles.manage",
    "settings.users.manage",
    "settings.integrations.manage",
  ],
  created_at: "2026-03-20T09:00:00Z",
};

const demoSetupStatus: SetupStatus = {
  setup_required: false,
  user_count: 1,
};

const demoLibraries: LibraryListResponse = {
  items: [
    {
      id: "library-site-atlas",
      name: "Atlas Operations",
      node_type: "site",
      path: "/Atlas Operations",
      stage_status: "connected",
      source: "Microsoft SharePoint",
      staged_item_count: 42,
      security_profiles: ["Operations", "Security Review"],
      owner: "Atlas Operator",
      notes: "Hosted demo uses a static SharePoint-style source map instead of live tenant content.",
      last_synced_at: timestamp,
      children: [
        {
          id: "library-folder-runbooks",
          name: "Runbooks",
          node_type: "folder",
          path: "/Atlas Operations/Runbooks",
          stage_status: "connected",
          source: "Microsoft SharePoint",
          staged_item_count: 18,
          security_profiles: ["Operations"],
          owner: "Atlas Operator",
          notes: "Operational procedures and checklist templates.",
          last_synced_at: timestamp,
          children: [],
        },
        {
          id: "library-folder-security",
          name: "Security Reviews",
          node_type: "folder",
          path: "/Atlas Operations/Security Reviews",
          stage_status: "staged",
          source: "Microsoft SharePoint",
          staged_item_count: 9,
          security_profiles: ["Security Review"],
          owner: "Atlas Operator",
          notes: "Quarterly review artifacts and remediation notes.",
          last_synced_at: timestamp,
          children: [],
        },
      ],
    },
    {
      id: "library-team-service-desk",
      name: "Service Desk",
      node_type: "team",
      path: "/Service Desk",
      stage_status: "connected",
      source: "Microsoft Teams",
      staged_item_count: 16,
      security_profiles: ["Help Desk"],
      owner: "Atlas Operator",
      notes: "Demo Teams workspace for knowledge shares and escalations.",
      last_synced_at: timestamp,
      children: [
        {
          id: "library-channel-escalations",
          name: "Escalations",
          node_type: "channel",
          path: "/Service Desk/Escalations",
          stage_status: "connected",
          source: "Microsoft Teams",
          staged_item_count: 6,
          security_profiles: ["Help Desk"],
          owner: "Atlas Operator",
          notes: "Escalated issue summaries staged from the hosted demo catalog.",
          last_synced_at: timestamp,
          children: [],
        },
      ],
    },
  ],
  stats: {
    total_sites: 2,
    staged_nodes: 5,
    secured_nodes: 5,
    referenced_profiles: 3,
  },
};

const demoAccessControl: AccessControlResponse = {
  permissions: [
    {
      key: "libraries.view",
      label: "View Libraries",
      description: "Open the libraries workspace and review staged sources.",
      group: "Modules",
    },
    {
      key: "users.view",
      label: "View Users",
      description: "Open the managed users inventory module.",
      group: "Modules",
    },
    {
      key: "devices.view",
      label: "View Devices",
      description: "Open the managed devices inventory module.",
      group: "Modules",
    },
    {
      key: "settings.profiles.manage",
      label: "Manage Profiles",
      description: "Review and edit reusable access profiles.",
      group: "Settings",
    },
    {
      key: "settings.users.manage",
      label: "Manage Access Users",
      description: "Review and edit SysAtlas sign-in accounts.",
      group: "Settings",
    },
    {
      key: "settings.integrations.manage",
      label: "Manage Integrations",
      description: "Review provider connection status and integration readiness.",
      group: "Settings",
    },
  ],
  profiles: [
    {
      id: "profile-super-admin",
      name: "Super Admin",
      description: "Full access to the hosted demo workspace.",
      permissions: [
        "libraries.view",
        "users.view",
        "devices.view",
        "settings.profiles.manage",
        "settings.users.manage",
        "settings.integrations.manage",
      ],
      is_system_profile: true,
      assigned_user_count: 1,
      created_at: "2026-03-20T09:00:00Z",
      updated_at: timestamp,
    },
    {
      id: "profile-operations",
      name: "Operations",
      description: "Read access across inventory and library data.",
      permissions: ["libraries.view", "users.view", "devices.view"],
      is_system_profile: false,
      assigned_user_count: 2,
      created_at: "2026-03-22T09:00:00Z",
      updated_at: timestamp,
    },
    {
      id: "profile-help-desk",
      name: "Help Desk",
      description: "Support-focused read access for the demo environment.",
      permissions: ["users.view", "devices.view"],
      is_system_profile: false,
      assigned_user_count: 1,
      created_at: "2026-03-24T09:00:00Z",
      updated_at: timestamp,
    },
  ],
  users: [
    {
      id: "demo-super-admin",
      first_name: "Atlas",
      last_name: "Operator",
      display_name: "Atlas Operator",
      email: "demo@sysatlas.dev",
      is_active: true,
      is_superuser: true,
      profile: {
        id: "profile-super-admin",
        name: "Super Admin",
        description: "Full access to the hosted demo workspace.",
      },
      permissions: demoUser.permissions,
      created_at: "2026-03-20T09:00:00Z",
      updated_at: timestamp,
    },
    {
      id: "demo-ops-manager",
      first_name: "Jordan",
      last_name: "Lee",
      display_name: "Jordan Lee",
      email: "jordan.lee@sysatlas.dev",
      is_active: true,
      is_superuser: false,
      profile: {
        id: "profile-operations",
        name: "Operations",
        description: "Read access across inventory and library data.",
      },
      permissions: ["libraries.view", "users.view", "devices.view"],
      created_at: "2026-03-22T12:00:00Z",
      updated_at: timestamp,
    },
    {
      id: "demo-help-desk",
      first_name: "Taylor",
      last_name: "Nguyen",
      display_name: "Taylor Nguyen",
      email: "taylor.nguyen@sysatlas.dev",
      is_active: true,
      is_superuser: false,
      profile: {
        id: "profile-help-desk",
        name: "Help Desk",
        description: "Support-focused read access for the demo environment.",
      },
      permissions: ["users.view", "devices.view"],
      created_at: "2026-03-24T12:00:00Z",
      updated_at: timestamp,
    },
  ],
};

const demoIntegrationsCatalog: IntegrationCatalogResponse = {
  providers: [
    {
      id: "microsoft_sharepoint",
      name: "Microsoft SharePoint",
      category: "Microsoft 365",
      description: "Stage document libraries and structured content from SharePoint sites.",
      auth_strategy: "oauth",
      supported_modules: ["libraries"],
      fields: [],
      setup_mode: "popup",
      launch_url: "https://sys-atlas.vercel.app/",
      documentation_url: null,
      launch_button_label: "Connect",
      setup_steps: [],
      security_notes: [],
    },
    {
      id: "intune",
      name: "Microsoft Intune",
      category: "Device Management",
      description: "Import managed device records for the Devices workspace.",
      auth_strategy: "oauth",
      supported_modules: ["devices"],
      fields: [],
      setup_mode: "popup",
      launch_url: "https://sys-atlas.vercel.app/",
      documentation_url: null,
      launch_button_label: "Connect",
      setup_steps: [],
      security_notes: [],
    },
    {
      id: "zoho",
      name: "Zoho One",
      category: "Identity",
      description: "Sync user directory data into the Users workspace.",
      auth_strategy: "oauth",
      supported_modules: ["users"],
      fields: [],
      setup_mode: "popup",
      launch_url: "https://sys-atlas.vercel.app/",
      documentation_url: null,
      launch_button_label: "Connect",
      setup_steps: [],
      security_notes: [],
    },
  ],
};

const demoIntegrationConnections: IntegrationListResponse = {
  items: [
    {
      id: "demo-sharepoint",
      provider: "microsoft_sharepoint",
      provider_name: "Microsoft SharePoint",
      category: "Microsoft 365",
      description: "Static SharePoint source map for the hosted demo.",
      tenant_label: "SysAtlas Demo Tenant",
      auth_strategy: "oauth",
      status: "connected",
      supported_modules: ["libraries"],
      configured_fields: ["tenant"],
      configured_secret_fields: [],
      config_preview: {
        tenant: "sysatlas-demo",
      },
      scopes: ["Sites.Read.All"],
      created_at: "2026-03-25T10:00:00Z",
      updated_at: timestamp,
    },
    {
      id: "demo-intune",
      provider: "intune",
      provider_name: "Microsoft Intune",
      category: "Device Management",
      description: "Static Intune-style device inventory for the hosted demo.",
      tenant_label: "SysAtlas Demo Tenant",
      auth_strategy: "oauth",
      status: "connected",
      supported_modules: ["devices"],
      configured_fields: ["tenant"],
      configured_secret_fields: [],
      config_preview: {
        tenant: "sysatlas-demo",
      },
      scopes: ["DeviceManagementManagedDevices.Read.All"],
      created_at: "2026-03-25T10:00:00Z",
      updated_at: timestamp,
    },
    {
      id: "demo-zoho",
      provider: "zoho",
      provider_name: "Zoho One",
      category: "Identity",
      description: "Static user inventory for the hosted demo.",
      tenant_label: "SysAtlas Demo Org",
      auth_strategy: "oauth",
      status: "connected",
      supported_modules: ["users"],
      configured_fields: ["organization"],
      configured_secret_fields: [],
      config_preview: {
        organization: "sysatlas-demo",
      },
      scopes: ["ZohoDirectory.users.READ"],
      created_at: "2026-03-25T10:00:00Z",
      updated_at: timestamp,
    },
  ],
};

export function getStaticDemoSetupStatus() {
  return { ...demoSetupStatus };
}

export function getStaticDemoSession(): AuthSessionResponse {
  return {
    user: { ...demoUser, permissions: [...demoUser.permissions], profile: demoUser.profile ? { ...demoUser.profile } : null },
  };
}

export function getStaticDemoAuthResponse(message: string): AuthResponse {
  return {
    message,
    user: getStaticDemoSession().user,
  };
}

export function getStaticDemoLibraries() {
  return structuredClone(demoLibraries);
}

export function getStaticDemoAccessControl() {
  return structuredClone(demoAccessControl);
}

export function getStaticDemoIntegrationCatalog() {
  return structuredClone(demoIntegrationsCatalog);
}

export function getStaticDemoIntegrationConnections() {
  return structuredClone(demoIntegrationConnections);
}
