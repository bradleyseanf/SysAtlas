from app.integrations.types import IntegrationFieldDefinition, IntegrationProviderDefinition

definition = IntegrationProviderDefinition(
    slug="microsoft_365_admin_center",
    name="Microsoft 365 Admin Center",
    category="Productivity",
    description="Track Microsoft 365 license, mailbox, and productivity-service administration in the same control plane.",
    auth_strategy="oauth_client_credentials",
    supported_modules=("users",),
    fields=(
        IntegrationFieldDefinition(
            key="tenant_id",
            label="Tenant ID",
            input_type="text",
            placeholder="00000000-0000-0000-0000-000000000000",
            help_text="Microsoft tenant identifier.",
        ),
        IntegrationFieldDefinition(
            key="client_id",
            label="Application Client ID",
            input_type="text",
            placeholder="Azure app registration client ID",
            help_text="Application identifier for Microsoft Graph or admin APIs.",
        ),
        IntegrationFieldDefinition(
            key="client_secret",
            label="Client Secret",
            input_type="password",
            placeholder="Paste the client secret",
            help_text="Stored encrypted in the SysAtlas database.",
            secret=True,
        ),
    ),
)
