from app.integrations.active_directory import definition as active_directory
from app.integrations.intune import definition as intune
from app.integrations.microsoft_365_admin_center import definition as microsoft_365_admin_center
from app.integrations.microsoft_entra import definition as microsoft_entra
from app.integrations.microsoft_exchange_admin_center import definition as microsoft_exchange_admin_center
from app.integrations.types import IntegrationProviderDefinition
from app.integrations.verizon_wireless import definition as verizon_wireless
from app.integrations.zoho import definition as zoho
from app.integrations.zoom import definition as zoom

INTEGRATION_REGISTRY: tuple[IntegrationProviderDefinition, ...] = (
    active_directory,
    intune,
    microsoft_365_admin_center,
    microsoft_entra,
    microsoft_exchange_admin_center,
    zoho,
    zoom,
    verizon_wireless,
)


def list_providers() -> list[IntegrationProviderDefinition]:
    return list(INTEGRATION_REGISTRY)


def get_provider(provider_slug: str) -> IntegrationProviderDefinition | None:
    for provider in INTEGRATION_REGISTRY:
        if provider.slug == provider_slug:
            return provider
    return None


def list_providers_for_module(module_name: str) -> list[IntegrationProviderDefinition]:
    return [provider for provider in INTEGRATION_REGISTRY if module_name in provider.supported_modules]
