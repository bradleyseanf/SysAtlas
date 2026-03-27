from app.integrations.types import IntegrationProviderDefinition

definition = IntegrationProviderDefinition(
    slug="microsoft_teams",
    name="Microsoft Teams",
    category="Collaboration",
    description="Connect Teams workspaces so SysAtlas can stage channel files and Teams-backed document libraries.",
    auth_strategy="oauth_authorization_code_pkce",
    supported_modules=("libraries",),
    launch_url="https://teams.microsoft.com/",
    documentation_url="https://learn.microsoft.com/en-us/graph/auth/",
    launch_button_label="Launch Teams Session",
    setup_steps=(
        "Open the Microsoft Teams sign-in flow in a secure browser popup.",
        "Authenticate with an approved tenant admin account and grant the requested Microsoft 365 access.",
        "Return to SysAtlas and complete the Teams connection after the Microsoft session succeeds.",
    ),
    security_notes=(
        "Teams access should be granted through Microsoft's hosted authorization experience.",
        "SysAtlas stores only encrypted connection metadata and does not write secrets into the repository.",
    ),
    fields=(),
)
