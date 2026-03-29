from app.integrations.types import IntegrationProviderDefinition

definition = IntegrationProviderDefinition(
    slug="zoho",
    name="Zoho One",
    category="Productivity",
    description="Connect Zoho One as a user-service integration for provisioning and offboarding workflows.",
    auth_strategy="oauth_authorization_code",
    supported_modules=("users",),
    documentation_url="https://www.zoho.com/accounts/protocol/oauth/web-apps/authorization-code-flow.html",
    launch_button_label="Connect",
    setup_steps=(
        "Open the Zoho One authorization popup from SysAtlas.",
        "Sign in to Zoho One and approve the requested scopes.",
        "SysAtlas exchanges the authorization code, encrypts the returned credentials, and saves the connection automatically.",
    ),
    security_notes=(
        "Zoho One uses an ORG client plus instance-level OAuth for organization-wide access.",
        "SysAtlas encrypts the stored Zoho One client credentials and user tokens before writing them to the database.",
    ),
    fields=(),
)
