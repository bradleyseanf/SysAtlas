import asyncio
from dataclasses import dataclass
from datetime import UTC, datetime

import httpx
from azure.core.credentials import AccessToken, TokenCredential
from fastapi import HTTPException, status
from kiota_abstractions.method import Method
from kiota_abstractions.request_information import RequestInformation
from msgraph_core import AzureIdentityAuthenticationProvider, BaseGraphRequestAdapter
from opentelemetry import trace
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.managed_device import ManagedDevice

GRAPH_ROOT = "https://graph.microsoft.com/v1.0"
MANAGED_DEVICES_URL = (
    f"{GRAPH_ROOT}/deviceManagement/managedDevices"
    "?$select=id,deviceName,operatingSystem,manufacturer,model,serialNumber,"
    "managedDeviceOwnerType,complianceState,managementAgent,userPrincipalName,lastSyncDateTime"
    "&$top=100"
)


class StaticAccessTokenCredential(TokenCredential):
    def __init__(self, access_token: str, expires_at: datetime) -> None:
        self._access_token = access_token
        self._expires_at = expires_at

    def get_token(self, *scopes: str, **kwargs: object) -> AccessToken:
        return AccessToken(
            token=self._access_token,
            expires_on=max(int(self._expires_at.timestamp()), int(datetime.now(tz=UTC).timestamp()) + 60),
        )


@dataclass(frozen=True, slots=True)
class IntuneImportResult:
    imported_count: int
    updated_count: int
    total_count: int


def _parse_graph_datetime(value: str | None) -> datetime | None:
    if value is None:
        return None

    normalized = value.strip()
    if not normalized:
        return None
    if normalized.endswith("Z"):
        normalized = normalized[:-1] + "+00:00"

    try:
        return datetime.fromisoformat(normalized)
    except ValueError:
        return None


def _coerce_string(value: object) -> str | None:
    if not isinstance(value, str):
        return None
    normalized = value.strip()
    return normalized or None


def _serialize_enum(value: object, *, default: str) -> str:
    normalized = _coerce_string(value)
    return normalized or default


async def _fetch_json_page(url: str, credential: StaticAccessTokenCredential) -> dict[str, object]:
    auth_provider = AzureIdentityAuthenticationProvider(
        credentials=credential,
        scopes=["https://graph.microsoft.com/.default"],
    )
    async with httpx.AsyncClient(timeout=30.0) as http_client:
        adapter = BaseGraphRequestAdapter(
            authentication_provider=auth_provider,
            http_client=http_client,
        )
        request_info = RequestInformation(method=Method.GET)
        request_info.url = url
        request_info.headers.try_add("Accept", "application/json")

        with trace.get_tracer(__name__).start_as_current_span("intune.fetch_devices") as span:
            response = await adapter.get_http_response_message(request_info, span)

    response.raise_for_status()
    payload = response.json()
    if not isinstance(payload, dict):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Microsoft Graph returned an unexpected managed devices response.",
        )
    return payload


async def _fetch_managed_devices(access_token: str, expires_at: datetime) -> list[dict[str, object]]:
    credential = StaticAccessTokenCredential(access_token=access_token, expires_at=expires_at)
    next_url = MANAGED_DEVICES_URL
    devices: list[dict[str, object]] = []

    try:
        while next_url:
            payload = await _fetch_json_page(next_url, credential)
            page_items = payload.get("value")
            if isinstance(page_items, list):
                devices.extend(item for item in page_items if isinstance(item, dict))
            next_url = _coerce_string(payload.get("@odata.nextLink")) or ""
    except httpx.HTTPStatusError as error:
        detail = "Microsoft Graph rejected the Intune managed devices request."
        try:
            payload = error.response.json()
        except ValueError:
            payload = None
        if isinstance(payload, dict):
            error_node = payload.get("error")
            if isinstance(error_node, dict):
                detail = _coerce_string(error_node.get("message")) or detail
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=detail) from error
    except httpx.HTTPError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Microsoft Graph could not be reached for Intune device import.",
        ) from error

    return devices


def import_managed_devices(*, db: Session, access_token: str, access_token_expires_at: datetime) -> IntuneImportResult:
    managed_devices = asyncio.run(
        _fetch_managed_devices(
            access_token=access_token,
            expires_at=access_token_expires_at,
        )
    )

    existing_devices = db.scalars(
        select(ManagedDevice).where(ManagedDevice.source_provider == "intune")
    ).all()
    existing_by_external_id = {
        device.external_id: device
        for device in existing_devices
        if device.external_id
    }

    imported_count = 0
    updated_count = 0

    for graph_device in managed_devices:
        external_id = _coerce_string(graph_device.get("id"))
        if external_id is None:
            continue

        existing = existing_by_external_id.get(external_id)
        device = existing or ManagedDevice(
            source_provider="intune",
            external_id=external_id,
            device_name=_coerce_string(graph_device.get("deviceName")) or external_id,
            platform="unknown",
        )

        device.source_provider = "intune"
        device.external_id = external_id
        device.device_name = _coerce_string(graph_device.get("deviceName")) or external_id
        device.platform = _coerce_string(graph_device.get("operatingSystem")) or "unknown"
        device.manufacturer = _coerce_string(graph_device.get("manufacturer"))
        device.model = _coerce_string(graph_device.get("model"))
        device.serial_number = _coerce_string(graph_device.get("serialNumber"))
        device.ownership = _serialize_enum(graph_device.get("managedDeviceOwnerType"), default="unknown")
        device.compliance_state = _serialize_enum(graph_device.get("complianceState"), default="unknown")
        device.management_state = _serialize_enum(graph_device.get("managementAgent"), default="managed")
        device.primary_user_email = _coerce_string(graph_device.get("userPrincipalName"))
        device.lifecycle_state = "active"
        device.last_check_in_at = _parse_graph_datetime(_coerce_string(graph_device.get("lastSyncDateTime")))

        if existing is None:
            db.add(device)
            existing_by_external_id[external_id] = device
            imported_count += 1
        else:
            updated_count += 1

    db.commit()
    return IntuneImportResult(
        imported_count=imported_count,
        updated_count=updated_count,
        total_count=len(managed_devices),
    )
