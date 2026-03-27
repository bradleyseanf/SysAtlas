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
            node_id="site-sharepoint-documents",
            name="SharePoint Documents",
            node_type="site",
            path="SharePoint Documents",
            stage_status="connected",
            staged_item_count=3184,
            security_profiles=["Platform Admin", "Identity Operations"],
            owner="SharePoint Operations",
            notes="Primary document estate discovered from the connected production SharePoint tenant.",
            last_synced_at=timestamp,
            children=[
                _node(
                    node_id="lib-human-resources",
                    name="Human_Resources",
                    node_type="library",
                    path="SharePoint Documents/Human_Resources",
                    stage_status="staged",
                    staged_item_count=124,
                    security_profiles=["Identity Operations"],
                    owner="HR Records",
                    last_synced_at=timestamp,
                ),
                _node(
                    node_id="lib-operations",
                    name="Operations",
                    node_type="library",
                    path="SharePoint Documents/Operations",
                    stage_status="review",
                    staged_item_count=88,
                    security_profiles=["Audit Viewer"],
                    owner="Operations Team",
                    last_synced_at=timestamp,
                ),
                _node(
                    node_id="lib-engineering-sandbox",
                    name="Engineering_Sandbox",
                    node_type="library",
                    path="SharePoint Documents/Engineering_Sandbox",
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
                    path="SharePoint Documents/Marketing",
                    stage_status="staged",
                    staged_item_count=204,
                    security_profiles=["Audit Viewer", "Identity Operations"],
                    owner="Marketing",
                    last_synced_at=timestamp,
                ),
                _node(
                    node_id="lib-legal",
                    name="Legal",
                    node_type="library",
                    path="SharePoint Documents/Legal",
                    stage_status="staged",
                    staged_item_count=92,
                    security_profiles=["Audit Viewer"],
                    owner="Legal",
                    last_synced_at=timestamp,
                ),
                _node(
                    node_id="lib-executive-management",
                    name="Executive_Management",
                    node_type="library",
                    path="SharePoint Documents/Executive_Management",
                    stage_status="connected",
                    staged_item_count=73,
                    security_profiles=["Platform Admin"],
                    owner="Leadership Team",
                    last_synced_at=timestamp,
                ),
                _node(
                    node_id="folder-finance",
                    name="Finance",
                    node_type="folder",
                    path="SharePoint Documents/Finance",
                    stage_status="connected",
                    staged_item_count=512,
                    security_profiles=["Platform Admin", "Audit Viewer"],
                    owner="Finance",
                    last_synced_at=timestamp,
                    children=[
                        _node(
                            node_id="lib-finance-payables",
                            name="Accounts_Payable",
                            node_type="library",
                            path="SharePoint Documents/Finance/Accounts_Payable",
                            stage_status="staged",
                            staged_item_count=108,
                            security_profiles=["Audit Viewer"],
                            owner="Payables Team",
                            last_synced_at=timestamp,
                        ),
                        _node(
                            node_id="lib-finance-receivables",
                            name="Accounts_Receivable",
                            node_type="library",
                            path="SharePoint Documents/Finance/Accounts_Receivable",
                            stage_status="staged",
                            staged_item_count=97,
                            security_profiles=["Audit Viewer"],
                            owner="Finance Shared Services",
                            last_synced_at=timestamp,
                        ),
                        _node(
                            node_id="lib-finance-reporting",
                            name="Reporting",
                            node_type="library",
                            path="SharePoint Documents/Finance/Reporting",
                            stage_status="review",
                            staged_item_count=84,
                            security_profiles=["Audit Viewer"],
                            owner="FP&A",
                            last_synced_at=timestamp,
                        ),
                        _node(
                            node_id="lib-finance-audit",
                            name="Audit_Preparation",
                            node_type="library",
                            path="SharePoint Documents/Finance/Audit_Preparation",
                            stage_status="review",
                            staged_item_count=109,
                            security_profiles=["Audit Viewer"],
                            owner="Audit Support",
                            last_synced_at=timestamp,
                        ),
                        _node(
                            node_id="lib-finance-policies",
                            name="Policies",
                            node_type="library",
                            path="SharePoint Documents/Finance/Policies",
                            stage_status="connected",
                            staged_item_count=114,
                            security_profiles=["Platform Admin", "Audit Viewer"],
                            owner="Finance Governance",
                            last_synced_at=timestamp,
                        ),
                    ],
                ),
                _node(
                    node_id="lib-documents",
                    name="Documents",
                    node_type="library",
                    path="SharePoint Documents/Documents",
                    stage_status="connected",
                    staged_item_count=910,
                    security_profiles=["Platform Admin", "Audit Viewer"],
                    owner="Operations",
                    last_synced_at=timestamp,
                ),
                _node(
                    node_id="lib-template",
                    name="Templates",
                    node_type="library",
                    path="SharePoint Documents/Templates",
                    stage_status="review",
                    staged_item_count=44,
                    security_profiles=["Platform Admin"],
                    owner="Template Control",
                    last_synced_at=timestamp,
                ),
                _node(
                    node_id="lib-it",
                    name="IT",
                    node_type="library",
                    path="SharePoint Documents/IT",
                    stage_status="staged",
                    staged_item_count=181,
                    security_profiles=["Platform Admin", "Device Operations"],
                    owner="IT Operations",
                    last_synced_at=timestamp,
                ),
            ],
        ),
        _node(
            node_id="site-workspace-staging",
            name="Workspace Staging",
            node_type="site",
            path="Workspace Staging",
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
                    path="Workspace Staging/Preflight",
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
                    path="Workspace Staging/Access_Matrix",
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
