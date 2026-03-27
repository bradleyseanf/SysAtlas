from app.integrations.types import IntegrationProviderDefinition

definition = IntegrationProviderDefinition(
    slug="microsoft_sharepoint",
    name="Microsoft SharePoint",
    category="Document Management",
    description="Connect SharePoint sites and document libraries so SysAtlas can stage and organize library sources.",
    auth_strategy="oauth_authorization_code_pkce",
    supported_modules=("libraries",),
    launch_url="https://www.microsoft.com/microsoft-365/sharepoint/collaboration",
    documentation_url="https://learn.microsoft.com/en-us/graph/auth/",
    launch_button_label="Launch SharePoint Session",
    setup_steps=(
        "Open the Microsoft-hosted SharePoint sign-in flow in a secure browser popup.",
        "Authenticate with a tenant admin account and approve the requested SharePoint and Graph access.",
        "Return to SysAtlas after the Microsoft session closes to finish the connection record.",
    ),
    security_notes=(
        "Use Microsoft-hosted sign-in and consent so credentials never pass through SysAtlas screens.",
        "Connection metadata stays in the encrypted application store and out of git-tracked files.",
    ),
    fields=(),
)
