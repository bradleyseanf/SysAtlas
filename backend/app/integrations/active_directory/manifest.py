from app.integrations.types import IntegrationFieldDefinition, IntegrationProviderDefinition

definition = IntegrationProviderDefinition(
    slug="active_directory",
    name="Active Directory (On-Prem)",
    category="Identity",
    description="Connect on-prem Active Directory for account lifecycle, group membership, and workstation associations.",
    auth_strategy="service_account",
    supported_modules=("users", "devices"),
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
