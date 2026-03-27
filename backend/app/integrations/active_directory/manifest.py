from app.integrations.types import IntegrationFieldDefinition, IntegrationProviderDefinition

definition = IntegrationProviderDefinition(
    slug="active_directory",
    name="Active Directory (On-Prem)",
    category="Identity",
    description="Connect on-prem Active Directory for account lifecycle, group membership, and workstation associations.",
    auth_strategy="service_account",
    supported_modules=("users", "devices"),
    launch_url="https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/get-started/virtual-dc/active-directory-domain-services-overview",
    documentation_url="https://learn.microsoft.com/en-us/windows-server/identity/ad-ds/get-started/virtual-dc/active-directory-domain-services-overview",
    launch_button_label="Open Setup Guide",
    setup_steps=(
        "Open the Microsoft Active Directory setup guide in a secure browser window.",
        "Complete the directory-side app and bind-account preparation outside SysAtlas.",
        "Return here and mark the integration as connected once your directory session is ready.",
    ),
    security_notes=(
        "Directory credentials should stay outside the repo and outside browser form fields.",
        "SysAtlas stores any future connector secrets encrypted with the runtime Fernet key.",
    ),
    fields=(
        IntegrationFieldDefinition(
            key="domain_controller",
            label="Domain Controller",
            input_type="text",
            placeholder="dc01.corp.example.com",
            help_text="Primary LDAP or domain controller hostname.",
        ),
        IntegrationFieldDefinition(
            key="base_dn",
            label="Base DN",
            input_type="text",
            placeholder="DC=corp,DC=example,DC=com",
            help_text="Root distinguished name used for directory queries.",
        ),
        IntegrationFieldDefinition(
            key="bind_username",
            label="Bind Username",
            input_type="text",
            placeholder="CORP\\sysatlas-reader",
            help_text="Directory account used to read and execute lifecycle actions.",
        ),
        IntegrationFieldDefinition(
            key="bind_password",
            label="Bind Password",
            input_type="password",
            placeholder="Enter directory password",
            help_text="Stored encrypted in the SysAtlas database.",
            secret=True,
        ),
    ),
)
