from app.integrations.types import IntegrationFieldDefinition, IntegrationProviderDefinition

definition = IntegrationProviderDefinition(
    slug="verizon_wireless",
    name="Verizon Wireless",
    category="Carrier",
    description="Track carrier-linked mobile devices and service actions from the same device-management workspace.",
    auth_strategy="account_api_key",
    supported_modules=("devices",),
    fields=(
        IntegrationFieldDefinition(
            key="billing_account_number",
            label="Billing Account Number",
            input_type="text",
            placeholder="1234567890",
            help_text="Verizon wireless billing or enterprise account number.",
        ),
        IntegrationFieldDefinition(
            key="api_username",
            label="API Username",
            input_type="text",
            placeholder="sysatlas-verizon",
            help_text="Username used for carrier automation access.",
        ),
        IntegrationFieldDefinition(
            key="api_key",
            label="API Key",
            input_type="password",
            placeholder="Paste the Verizon API key",
            help_text="Stored encrypted in the SysAtlas database.",
            secret=True,
        ),
    ),
)
