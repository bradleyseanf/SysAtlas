from app.integrations.types import IntegrationFieldDefinition, IntegrationProviderDefinition

definition = IntegrationProviderDefinition(
    slug="microsoft_entra",
    name="Microsoft Entra",
    category="Identity",
    description="Use Microsoft Entra as a cloud identity authority for joiner, mover, and leaver workflows.",
    auth_strategy="oauth_client_credentials",
    supported_modules=("users", "devices"),
    fields=(
        IntegrationFieldDefinition(
            key="tenant_id",
            label="Tenant ID",
            input_type="text",
            placeholder="00000000-0000-0000-0000-000000000000",
            help_text="Entra tenant identifier.",
        ),
        IntegrationFieldDefinition(
            key="client_id",
            label="Application Client ID",
            input_type="text",
            placeholder="Azure app registration client ID",
            help_text="Application registration used to access Microsoft Graph.",
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
