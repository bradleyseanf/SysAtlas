from app.integrations.types import IntegrationFieldDefinition, IntegrationProviderDefinition

definition = IntegrationProviderDefinition(
    slug="intune",
    name="Intune",
    category="Device Management",
    description="Configure Microsoft Intune as a device inventory and policy source for corporate endpoints.",
    auth_strategy="oauth_client_credentials",
    supported_modules=("devices",),
    launch_url="https://intune.microsoft.com/",
    documentation_url="https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow",
    launch_button_label="Launch Intune Session",
    setup_steps=(
        "Open the Microsoft Intune admin center in a secure browser popup.",
        "Authenticate with an administrator account and approve the requested tenant access.",
        "Return to SysAtlas and finish the link once the Microsoft session is complete.",
    ),
    security_notes=(
        "Microsoft delegated sign-in should run in the external browser, not inside embedded form fields.",
        "Consent state and any future secrets remain outside source control and local repo files.",
    ),
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
