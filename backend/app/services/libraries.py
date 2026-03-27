from collections import defaultdict

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.integrations.registry import get_provider
from app.models.integration_connection import IntegrationConnection
from app.schemas.libraries import LibraryListResponse, LibraryStatsResponse, LibraryTreeNodeResponse
from app.services.integrations import ACTIVE_CONNECTION_STATUSES

LIBRARY_PENDING_STATUSES = {"authorization_pending"}
LIBRARY_VISIBLE_STATUSES = ACTIVE_CONNECTION_STATUSES | LIBRARY_PENDING_STATUSES


def _connection_stage_status(status: str) -> str:
    if status in ACTIVE_CONNECTION_STATUSES:
        return "connected"
    if status in LIBRARY_PENDING_STATUSES:
        return "staged"
    return "review"


def _provider_stage_status(children: list[LibraryTreeNodeResponse]) -> str:
    if any(child.stage_status == "connected" for child in children):
        return "connected"
    if any(child.stage_status == "staged" for child in children):
        return "staged"
    return "review"


def _build_provider_node(provider_slug: str, children: list[LibraryTreeNodeResponse]) -> LibraryTreeNodeResponse | None:
    provider = get_provider(provider_slug)
    if provider is None or "libraries" not in provider.supported_modules:
        return None

    latest_sync = max((child.last_synced_at for child in children if child.last_synced_at is not None), default=None)
    connected_children = sum(child.stage_status == "connected" for child in children)
    staged_children = sum(child.stage_status == "staged" for child in children)
    note_parts = [f"{len(children)} source" + ("s" if len(children) != 1 else "")]
    if connected_children:
        note_parts.append(f"{connected_children} connected")
    if staged_children:
        note_parts.append(f"{staged_children} pending")

    return LibraryTreeNodeResponse(
        id=f"provider-{provider.slug}",
        name=provider.name,
        node_type="provider",
        path=provider.name,
        stage_status=_provider_stage_status(children),
        source=provider.name,
        staged_item_count=len(children),
        security_profiles=[],
        owner="Settings / Integrations",
        notes=", ".join(note_parts).capitalize() + ".",
        last_synced_at=latest_sync,
        children=sorted(children, key=lambda item: item.name.lower()),
    )


def list_libraries(db: Session) -> LibraryListResponse:
    grouped_children: dict[str, list[LibraryTreeNodeResponse]] = defaultdict(list)
    connections = db.scalars(
        select(IntegrationConnection).order_by(IntegrationConnection.updated_at.desc())
    ).all()

    for connection in connections:
        if connection.status not in LIBRARY_VISIBLE_STATUSES:
            continue

        provider = get_provider(connection.provider)
        if provider is None or "libraries" not in provider.supported_modules:
            continue

        grouped_children[provider.slug].append(
            LibraryTreeNodeResponse(
                id=f"connection-{connection.id}",
                name=connection.tenant_label,
                node_type="connection",
                path=f"{provider.name}/{connection.tenant_label}",
                stage_status=_connection_stage_status(connection.status),
                source=provider.name,
                staged_item_count=0,
                security_profiles=[],
                owner="Connected integration",
                notes=(
                    f"{provider.name} is linked through the integrations workspace. "
                    "Discovered libraries will appear here after source syncs are enabled."
                ),
                last_synced_at=connection.updated_at,
                children=[],
            )
        )

    items = [
        provider_node
        for provider_slug, children in grouped_children.items()
        if (provider_node := _build_provider_node(provider_slug, children)) is not None
    ]
    items.sort(key=lambda item: item.name.lower())

    flattened = [item for node in items for item in [node, *node.children]]
    return LibraryListResponse(
        items=items,
        stats=LibraryStatsResponse(
            total_sites=len(items),
            staged_nodes=sum(node.stage_status == "staged" for node in flattened),
            secured_nodes=sum(node.stage_status == "connected" for node in flattened),
            referenced_profiles=0,
        ),
    )
