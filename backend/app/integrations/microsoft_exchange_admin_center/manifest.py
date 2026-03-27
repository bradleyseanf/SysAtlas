from app.integrations.types import IntegrationFieldDefinition, IntegrationProviderDefinition

definition = IntegrationProviderDefinition(
    slug="microsoft_exchange_admin_center",
    name="Microsoft Exchange Admin Center",
    category="Messaging",
    description="Prepare Exchange administration for mailbox offboarding, forwarding, and access-transfer tasks.",
    auth_strategy="oauth_client_credentials",
    supported_modules=("users",),
    launch_url="https://admin.exchange.microsoft.com/",
    documentation_url="https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow",
    launch_button_label="Launch Exchange Session",
    setup_steps=(
        "Open Exchange Admin Center in a secure browser popup.",
        "Sign in with the appropriate Exchange admin account and approve access.",
        "Return to SysAtlas and save the linked session after browser authorization is complete.",
    ),
    security_notes=(
        "Exchange access is initiated in Microsoft's hosted admin experience.",
        "Any stored secrets remain encrypted and outside git-tracked artifacts.",
    ),
    fields=(
        IntegrationFieldDefinition(
            key="tenant_id",
            label="Tenant ID",
            input_type="text",
            placeholder="00000000-0000-0000-0000-000000000000",
            help_text="Microsoft tenant identifier.",
        ),
        IntegrationFieldDefinition(
            key="admin_upn",
            label="Admin UPN",
            input_type="email",
            placeholder="exchange-admin@company.com",
            help_text="Administrative user principal name for Exchange automation.",
        ),
        IntegrationFieldDefinition(
            key="certificate_thumbprint",
            label="Certificate Thumbprint",
            input_type="text",
            placeholder="ABC123DEF456",
            help_text="Thumbprint for Exchange Online PowerShell or API authentication.",
        ),
    ),
)
