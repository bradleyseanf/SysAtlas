from datetime import UTC, datetime

from app.schemas.libraries import LibraryListResponse, LibraryStatsResponse, LibraryTreeNodeResponse


def _node(
    *,
    node_id: str,
    name: str,
    node_type: str,
    path: str,
    stage_status: str,
    staged_item_count: int,
    security_profiles: list[str],
    owner: str | None = None,
    notes: str | None = None,
    last_synced_at: datetime | None = None,
    children: list[LibraryTreeNodeResponse] | None = None,
) -> LibraryTreeNodeResponse:
    return LibraryTreeNodeResponse(
        id=node_id,
        name=name,
        node_type=node_type,
        path=path,
        stage_status=stage_status,
        source="SharePoint",
        staged_item_count=staged_item_count,
        security_profiles=security_profiles,
        owner=owner,
        notes=notes,
        last_synced_at=last_synced_at,
        children=children or [],
    )


def _sample_tree() -> list[LibraryTreeNodeResponse]:
    timestamp = datetime(2026, 3, 26, 16, 45, tzinfo=UTC)
    return [
        _node(
            node_id="site-cidan-documents",
            name="CIDAN-Documents",
            node_type="site",
            path="CIDAN-Documents",
            stage_status="connected",
            staged_item_count=3184,
            security_profiles=["Platform Admin", "Identity Operations"],
            owner="SharePoint Operations",
            notes="Primary document estate discovered from the production SharePoint tenant.",
            last_synced_at=timestamp,
            children=[
                _node(
                    node_id="lib-cmat-hr",
                    name="CMAT_HR",
                    node_type="library",
                    path="CIDAN-Documents/CMAT_HR",
                    stage_status="staged",
                    staged_item_count=124,
                    security_profiles=["Identity Operations"],
                    owner="HR Records",
                    last_synced_at=timestamp,
                ),
                _node(
                    node_id="lib-cmat",
                    name="CMAT",
                    node_type="library",
                    path="CIDAN-Documents/CMAT",
                    stage_status="review",
                    staged_item_count=88,
                    security_profiles=["Audit Viewer"],
                    owner="CMAT Operations",
                    last_synced_at=timestamp,
                ),
                _node(
                    node_id="lib-cmat-test",
                    name="CMAT_Test",
                    node_type="library",
                    path="CIDAN-Documents/CMAT_Test",
                    stage_status="review",
                    staged_item_count=47,
                    security_profiles=["Platform Admin"],
                    owner="Engineering Sandbox",
                    last_synced_at=timestamp,
                ),
                _node(
                    node_id="lib-marketing",
                    name="Marketing",
                    node_type="library",
                    path="CIDAN-Documents/Marketing",
                    stage_status="staged",
                    staged_item_count=204,
                    security_profiles=["Audit Viewer", "Identity Operations"],
                    owner="Marketing",
                    last_synced_at=timestamp,
                ),
                _node(
                    node_id="lib-cmse",
                    name="CMSE",
                    node_type="library",
                    path="CIDAN-Documents/CMSE",
                    stage_status="staged",
                    staged_item_count=92,
                    security_profiles=["Audit Viewer"],
                    owner="CMSE",
                    last_synced_at=timestamp,
                ),
                _node(
                    node_id="lib-cidan-management",
                    name="CIDAN_Management",
                    node_type="library",
                    path="CIDAN-Documents/CIDAN_Management",
                    stage_status="connected",
                    staged_item_count=73,
                    security_profiles=["Platform Admin"],
                    owner="Leadership Team",
                    last_synced_at=timestamp,
                ),
                _node(
                    node_id="folder-80-finance",
                    name="80_Finance",
                    node_type="folder",
                    path="CIDAN-Documents/80_Finance",
                    stage_status="connected",
                    staged_item_count=512,
                    security_profiles=["Platform Admin", "Audit Viewer"],
                    owner="Finance",
                    last_synced_at=timestamp,
                    children=[
                        _node(
                            node_id="lib-080-10-fi-cmg",
                            name="080.10_FI_CMG",
                            node_type="library",
                            path="CIDAN-Documents/80_Finance/080.10_FI_CMG",
                            stage_status="staged",
                            staged_item_count=108,
                            security_profiles=["Audit Viewer"],
                            owner="Controller Group",
                            last_synced_at=timestamp,
                        ),
                        _node(
                            node_id="lib-080-20-fi-cmse",
                            name="080.20_FI_CMSE",
                            node_type="library",
                            path="CIDAN-Documents/80_Finance/080.20_FI_CMSE",
                            stage_status="staged",
                            staged_item_count=97,
                            security_profiles=["Audit Viewer"],
                            owner="Finance Shared Services",
                            last_synced_at=timestamp,
                        ),
                        _node(
                            node_id="lib-080-30-fi-cmat",
                            name="080.30_FI_CMAT",
                            node_type="library",
                            path="CIDAN-Documents/80_Finance/080.30_FI_CMAT",
                            stage_status="review",
                            staged_item_count=84,
                            security_profiles=["Audit Viewer"],
                            owner="CMAT Finance",
                            last_synced_at=timestamp,
                        ),
                        _node(
                            node_id="lib-080-40-fi-cmch",
                            name="080.40_FI_CMCH",
                            node_type="library",
                            path="CIDAN-Documents/80_Finance/080.40_FI_CMCH",
                            stage_status="review",
                            staged_item_count=109,
                            security_profiles=["Audit Viewer"],
                            owner="CMCH Finance",
                            last_synced_at=timestamp,
                        ),
                        _node(
                            node_id="lib-080-50-fi-cma",
                            name="080.50_FI_CMA",
                            node_type="library",
                            path="CIDAN-Documents/80_Finance/080.50_FI_CMA",
                            stage_status="connected",
                            staged_item_count=114,
                            security_profiles=["Platform Admin", "Audit Viewer"],
                            owner="CMA Finance",
                            last_synced_at=timestamp,
                        ),
                    ],
                ),
                _node(
                    node_id="lib-documents",
                    name="Documents",
                    node_type="library",
                    path="CIDAN-Documents/Documents",
                    stage_status="connected",
                    staged_item_count=910,
                    security_profiles=["Platform Admin", "Audit Viewer"],
                    owner="Operations",
                    last_synced_at=timestamp,
                ),
                _node(
                    node_id="lib-template",
                    name="Template",
                    node_type="library",
                    path="CIDAN-Documents/Template",
                    stage_status="review",
                    staged_item_count=44,
                    security_profiles=["Platform Admin"],
                    owner="Template Control",
                    last_synced_at=timestamp,
                ),
                _node(
                    node_id="lib-100-it",
                    name="100_IT",
                    node_type="library",
                    path="CIDAN-Documents/100_IT",
                    stage_status="staged",
                    staged_item_count=181,
                    security_profiles=["Platform Admin", "Device Operations"],
                    owner="IT Operations",
                    last_synced_at=timestamp,
                ),
            ],
        ),
        _node(
            node_id="site-sysatlas-stage",
            name="SysAtlas-Staging",
            node_type="site",
            path="SysAtlas-Staging",
            stage_status="review",
            staged_item_count=264,
            security_profiles=["Platform Admin"],
            owner="Platform Engineering",
            notes="Working area for validating profile assignments before promoting into production.",
            last_synced_at=timestamp,
            children=[
                _node(
                    node_id="lib-preflight",
                    name="Preflight",
                    node_type="library",
                    path="SysAtlas-Staging/Preflight",
                    stage_status="review",
                    staged_item_count=51,
                    security_profiles=["Platform Admin"],
                    owner="Platform Engineering",
                    last_synced_at=timestamp,
                ),
                _node(
                    node_id="lib-access-matrix",
                    name="Access_Matrix",
                    node_type="library",
                    path="SysAtlas-Staging/Access_Matrix",
                    stage_status="staged",
                    staged_item_count=23,
                    security_profiles=["Platform Admin", "Identity Operations"],
                    owner="Governance",
                    last_synced_at=timestamp,
                ),
            ],
        ),
    ]


def _walk(nodes: list[LibraryTreeNodeResponse]) -> list[LibraryTreeNodeResponse]:
    flattened: list[LibraryTreeNodeResponse] = []
    for node in nodes:
        flattened.append(node)
        flattened.extend(_walk(node.children))
    return flattened


def list_libraries() -> LibraryListResponse:
    items = _sample_tree()
    flattened = _walk(items)
    profile_names = {
        profile_name
        for node in flattened
        for profile_name in node.security_profiles
    }

    return LibraryListResponse(
        items=items,
        stats=LibraryStatsResponse(
            total_sites=sum(node.node_type == "site" for node in flattened),
            staged_nodes=sum(node.stage_status == "staged" for node in flattened),
            secured_nodes=sum(bool(node.security_profiles) for node in flattened),
            referenced_profiles=len(profile_names),
        ),
    )
