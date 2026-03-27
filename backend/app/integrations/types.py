from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class IntegrationFieldDefinition:
    key: str
    label: str
    input_type: str
    placeholder: str = ""
    help_text: str = ""
    required: bool = True
    secret: bool = False


@dataclass(frozen=True, slots=True)
class IntegrationProviderDefinition:
    slug: str
    name: str
    category: str
    description: str
    auth_strategy: str
    supported_modules: tuple[str, ...]
    fields: tuple[IntegrationFieldDefinition, ...]
