from app.integrations.types import IntegrationProviderDefinition

definition = IntegrationProviderDefinition(
    slug="zoho",
    name="Zoho",
    category="Productivity",
    description="Register Zoho as a user-service integration for provisioning and offboarding workflows.",
    auth_strategy="oauth_authorization_code",
    supported_modules=("users",),
    documentation_url="https://www.zoho.com/accounts/protocol/oauth/web-apps/authorization-code-flow.html",
    launch_button_label="Connect",
    setup_steps=(
        "Open the Zoho authorization popup from SysAtlas.",
        "Sign in to Zoho and approve the requested scopes.",
        "SysAtlas exchanges the authorization code, encrypts the returned credentials, and saves the connection automatically.",
    ),
    security_notes=(
        "Zoho returns a short-lived access token and a refresh token for offline access.",
        "SysAtlas encrypts the stored Zoho credentials before writing them to the database.",
    ),
    fields=(),
)
