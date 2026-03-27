from app.integrations.types import IntegrationFieldDefinition, IntegrationProviderDefinition

definition = IntegrationProviderDefinition(
    slug="zoho",
    name="Zoho",
    category="Productivity",
    description="Register Zoho as a user-service integration for provisioning and offboarding workflows.",
    auth_strategy="oauth_authorization_code",
    supported_modules=("users",),
    launch_url="https://api-console.zoho.com/",
    documentation_url="https://www.zoho.com/accounts/protocol/oauth/self-client/authorization-code-flow.html",
    launch_button_label="Launch Zoho Session",
    setup_steps=(
        "Open the Zoho API console in a secure browser popup.",
        "Sign in, create or select the client, and generate the authorization handoff in Zoho.",
        "Return to SysAtlas and finalize the linked connection after the Zoho session completes.",
    ),
    security_notes=(
        "Zoho issues short-lived access tokens and long-lived refresh tokens through its OAuth token endpoint.",
        "SysAtlas keeps any future secret material encrypted and outside git-tracked files.",
    ),
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
