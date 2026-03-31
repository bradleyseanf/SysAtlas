from app.integrations.types import IntegrationProviderDefinition

definition = IntegrationProviderDefinition(
    slug="intune",
    name="Intune",
    category="Device Management",
    description="Sign in with Microsoft Intune and import managed devices into the SysAtlas inventory.",
    auth_strategy="oauth_authorization_code",
    supported_modules=("devices",),
    launch_url="https://intune.microsoft.com/",
    documentation_url="https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow",
    launch_button_label="Connect Intune",
    setup_steps=(
        "Open the Microsoft sign-in popup from SysAtlas.",
        "Authenticate with an Intune-enabled administrator account and approve the requested tenant access.",
        "SysAtlas stores the granted token securely, then imports the current Intune managed devices.",
    ),
    security_notes=(
        "Microsoft delegated sign-in runs in an external browser popup instead of embedded credentials fields.",
        "Granted Microsoft tokens are encrypted before they are stored in the SysAtlas database.",
    ),
    fields=(),
)
