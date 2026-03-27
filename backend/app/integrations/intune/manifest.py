from app.integrations.types import IntegrationFieldDefinition, IntegrationProviderDefinition

definition = IntegrationProviderDefinition(
    slug="intune",
    name="Intune",
    category="Device Management",
    description="Configure Microsoft Intune as a device inventory and policy source for corporate endpoints.",
    auth_strategy="oauth_client_credentials",
    supported_modules=("devices",),
    fields=(
        IntegrationFieldDefinition(
            key="tenant_id",
            label="Tenant ID",
            input_type="text",
            placeholder="00000000-0000-0000-0000-000000000000",
            help_text="Microsoft Entra tenant identifier.",
        ),
        IntegrationFieldDefinition(
            key="client_id",
            label="Application Client ID",
            input_type="text",
            placeholder="Azure app registration client ID",
            help_text="Client ID for the Intune API application registration.",
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
