from app.integrations.types import IntegrationFieldDefinition, IntegrationProviderDefinition

definition = IntegrationProviderDefinition(
    slug="zoho",
    name="Zoho",
    category="Productivity",
    description="Register Zoho as a user-service integration for provisioning and offboarding workflows.",
    auth_strategy="api_token",
    supported_modules=("users",),
    fields=(
        IntegrationFieldDefinition(
            key="organization_id",
            label="Organization ID",
            input_type="text",
            placeholder="123456789",
            help_text="Zoho organization identifier.",
        ),
        IntegrationFieldDefinition(
            key="admin_email",
            label="Admin Email",
            input_type="email",
            placeholder="it-admin@company.com",
            help_text="Administrative mailbox used for Zoho operations.",
        ),
        IntegrationFieldDefinition(
            key="api_token",
            label="API Token",
            input_type="password",
            placeholder="Paste the Zoho API token",
            help_text="Stored encrypted in the SysAtlas database.",
            secret=True,
        ),
    ),
)
