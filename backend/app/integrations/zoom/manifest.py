from app.integrations.types import IntegrationFieldDefinition, IntegrationProviderDefinition

definition = IntegrationProviderDefinition(
    slug="zoom",
    name="Zoom",
    category="Collaboration",
    description="Configure Zoom administration for account deprovisioning, license reassignment, and telephony coordination.",
    auth_strategy="server_to_server_oauth",
    supported_modules=("users",),
    fields=(
        IntegrationFieldDefinition(
            key="account_id",
            label="Account ID",
            input_type="text",
            placeholder="Zoom account ID",
            help_text="Zoom account identifier.",
        ),
        IntegrationFieldDefinition(
            key="client_id",
            label="Client ID",
            input_type="text",
            placeholder="Server-to-server OAuth client ID",
            help_text="Zoom OAuth client ID.",
        ),
        IntegrationFieldDefinition(
            key="client_secret",
            label="Client Secret",
            input_type="password",
            placeholder="Paste the Zoom client secret",
            help_text="Stored encrypted in the SysAtlas database.",
            secret=True,
        ),
    ),
)
