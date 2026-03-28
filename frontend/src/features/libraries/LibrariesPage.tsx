import type { ReactNode } from "react";
import { useDeferredValue, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
  CSpinner,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilChevronRight, cilFolder, cilFolderOpen, cilSearch } from "@coreui/icons";
import { useNavigate } from "react-router-dom";

import { EmptyState } from "../../components/EmptyState";
import { StatusBadge } from "../../components/StatusBadge";
import { api } from "../../lib/api";
import { hasPermission, settingsRoutePermissions } from "../../lib/access";
import { useDevModeUrlState } from "../../lib/devMode";
import { formatDateTime, humanizeKey } from "../../lib/formatters";
import type { LibraryNode } from "../../types/api";
import { useAuth } from "../auth/AuthContext";

function flattenNodes(nodes: LibraryNode[]): LibraryNode[] {
  return nodes.flatMap((node) => [node, ...flattenNodes(node.children)]);
}

function findNode(nodes: LibraryNode[], targetId: string): LibraryNode | null {
  for (const node of nodes) {
    if (node.id === targetId) {
      return node;
    }

    const childMatch = findNode(node.children, targetId);
    if (childMatch) {
      return childMatch;
    }
  }

  return null;
}

function collectExpandableIds(nodes: LibraryNode[]): string[] {
  return nodes.flatMap((node) => (node.children.length ? [node.id, ...collectExpandableIds(node.children)] : []));
}

function filterNodes(nodes: LibraryNode[], query: string): LibraryNode[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return nodes;
  }

  return nodes.flatMap((node) => {
    const filteredChildren = filterNodes(node.children, normalized);
    const matches =
      node.name.toLowerCase().includes(normalized) ||
      node.path.toLowerCase().includes(normalized) ||
      node.source.toLowerCase().includes(normalized) ||
      node.notes?.toLowerCase().includes(normalized);

    if (!matches && filteredChildren.length === 0) {
      return [];
    }

    return [{ ...node, children: filteredChildren }];
  });
}

function stageTone(stageStatus: string) {
  if (stageStatus === "connected") {
    return "positive" as const;
  }
  if (stageStatus === "staged") {
    return "info" as const;
  }
  return "warning" as const;
}

export function LibrariesPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { withDevMode } = useDevModeUrlState();
  const librariesQuery = useQuery({
    queryKey: ["libraries"],
    queryFn: api.getLibraries,
  });
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [expandedNodeIds, setExpandedNodeIds] = useState<string[]>([]);

  const items = librariesQuery.data?.items ?? [];
  const visibleItems = filterNodes(items, deferredSearch);
  const flattenedNodes = flattenNodes(items);
  const selectedNode = findNode(items, selectedNodeId) ?? flattenedNodes[0] ?? null;
  const expandableNodeIds = collectExpandableIds(items);
  const canManageIntegrations = session ? hasPermission(session.user, settingsRoutePermissions.integrations) : false;

  useEffect(() => {
    if (!items.length) {
      setSelectedNodeId("");
      setExpandedNodeIds([]);
      return;
    }

    setExpandedNodeIds((current) => (current.length ? current : expandableNodeIds));
    setSelectedNodeId((current) => current || items[0]?.id || "");
  }, [expandableNodeIds, items]);

  function toggleNode(nodeId: string) {
    setExpandedNodeIds((current) =>
      current.includes(nodeId) ? current.filter((item) => item !== nodeId) : [...current, nodeId]
    );
  }

  function renderNode(node: LibraryNode, depth = 0): ReactNode {
    const hasChildren = node.children.length > 0;
    const isExpanded = deferredSearch ? true : expandedNodeIds.includes(node.id);
    const isSelected = selectedNode?.id === node.id;

    return (
      <div key={node.id} className="mb-1" style={{ marginLeft: depth ? `${depth * 1.1}rem` : undefined }}>
        <div className={`d-flex align-items-center gap-2 rounded border ${isSelected ? "border-primary bg-primary bg-opacity-10" : "border-transparent"}`}>
          {hasChildren ? (
            <button
              type="button"
              onClick={() => toggleNode(node.id)}
              className="btn btn-sm btn-ghost-secondary border-0 ms-1"
              aria-label={isExpanded ? `Collapse ${node.name}` : `Expand ${node.name}`}
            >
              <CIcon icon={cilChevronRight} style={{ transform: isExpanded ? "rotate(90deg)" : undefined }} />
            </button>
          ) : (
            <span className="d-inline-block ms-1" style={{ width: "2rem" }} />
          )}

          <button
            type="button"
            onClick={() => setSelectedNodeId(node.id)}
            className="flex-grow-1 border-0 bg-transparent px-0 py-2 pe-2 text-start"
          >
            <div className="d-flex align-items-center justify-content-between gap-2">
              <span className="d-flex min-w-0 align-items-center gap-2">
                <CIcon icon={hasChildren && isExpanded ? cilFolderOpen : cilFolder} className="flex-shrink-0 text-body-secondary" />
                <span className="small fw-semibold text-truncate">{node.name}</span>
              </span>
              <span className="small text-body-secondary text-uppercase d-none d-md-inline">{humanizeKey(node.node_type)}</span>
            </div>
          </button>
        </div>

        {hasChildren && isExpanded ? <div className="mt-1">{node.children.map((child) => renderNode(child, depth + 1))}</div> : null}
      </div>
    );
  }

  if (librariesQuery.isLoading) {
    return (
      <CCard className="shadow-sm">
        <CCardBody className="py-5 text-center text-body-secondary">
          <CSpinner color="primary" className="mb-3" />
          <div>Loading library sources...</div>
        </CCardBody>
      </CCard>
    );
  }

  if (librariesQuery.isError) {
    return (
      <CAlert color="danger" className="mb-0">
        {librariesQuery.error instanceof Error ? librariesQuery.error.message : "Unable to load libraries."}
      </CAlert>
    );
  }

  if (!items.length) {
    return (
      <EmptyState
        title="No library sources connected"
        description="Connect Microsoft SharePoint or Microsoft Teams in Settings / Integrations, then the connected sources will appear here."
        actionLabel={canManageIntegrations ? "Open Integrations" : "Refresh"}
        onAction={() => (canManageIntegrations ? navigate(withDevMode("/settings/integrations?module=libraries")) : void librariesQuery.refetch())}
      />
    );
  }

  return (
    <div className="d-grid gap-4">
      {canManageIntegrations ? (
        <div className="d-flex justify-content-end">
          <CButton color="primary" onClick={() => navigate(withDevMode("/settings/integrations?module=libraries"))}>
            Manage Sources
          </CButton>
        </div>
      ) : null}

      <CRow className="g-4">
        <CCol xl={5}>
          <CCard className="h-100 shadow-sm">
            <CCardHeader className="d-flex flex-wrap align-items-start justify-content-between gap-3">
              <div>
                <p className="mb-1 fw-semibold">Connected Library Sources</p>
                <p className="mb-0 text-body-secondary">
                  SharePoint and Teams sources appear here as integration sessions are linked.
                </p>
              </div>

              <div className="d-grid gap-2" style={{ maxWidth: "22rem", width: "100%" }}>
                <CInputGroup>
                  <CInputGroupText>
                    <CIcon icon={cilSearch} />
                  </CInputGroupText>
                  <CFormInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search sources" />
                </CInputGroup>

                <div className="d-flex gap-2">
                  <CButton color="secondary" variant="outline" size="sm" onClick={() => setExpandedNodeIds(expandableNodeIds)}>
                    Expand
                  </CButton>
                  <CButton color="secondary" variant="outline" size="sm" onClick={() => setExpandedNodeIds([])}>
                    Collapse
                  </CButton>
                </div>
              </div>
            </CCardHeader>

            <CCardBody className="overflow-auto" style={{ maxHeight: "45rem" }}>
              {visibleItems.length ? (
                <div>{visibleItems.map((node) => renderNode(node))}</div>
              ) : (
                <div className="rounded border border-2 p-4 text-center text-body-secondary" style={{ borderStyle: "dashed" }}>
                  No connected library sources match the current search.
                </div>
              )}
            </CCardBody>
          </CCard>
        </CCol>

        <CCol xl={7}>
          <CCard className="h-100 shadow-sm">
            <CCardBody>
              {selectedNode ? (
                <>
                  <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
                    <div>
                      <p className="mb-2 small fw-semibold text-body-secondary text-uppercase">{selectedNode.source}</p>
                      <h2 className="h3 mb-2">{selectedNode.name}</h2>
                      <p className="mb-0 text-body-secondary">
                        {selectedNode.notes ?? "This source is available for library staging once connected integrations are ready."}
                      </p>
                    </div>
                    <StatusBadge label={humanizeKey(selectedNode.stage_status)} tone={stageTone(selectedNode.stage_status)} />
                  </div>

                  <CRow className="g-3 mt-1">
                    <CCol sm={6}>
                      <CCard className="h-100 border-0 bg-body-tertiary">
                        <CCardBody>
                          <p className="mb-2 small fw-semibold text-body-secondary text-uppercase">Path</p>
                          <p className="mb-0">{selectedNode.path}</p>
                        </CCardBody>
                      </CCard>
                    </CCol>
                    <CCol sm={6}>
                      <CCard className="h-100 border-0 bg-body-tertiary">
                        <CCardBody>
                          <p className="mb-2 small fw-semibold text-body-secondary text-uppercase">Type</p>
                          <p className="mb-0">{humanizeKey(selectedNode.node_type)}</p>
                        </CCardBody>
                      </CCard>
                    </CCol>
                    <CCol sm={6}>
                      <CCard className="h-100 border-0 bg-body-tertiary">
                        <CCardBody>
                          <p className="mb-2 small fw-semibold text-body-secondary text-uppercase">Visible Entries</p>
                          <p className="mb-0">{selectedNode.staged_item_count}</p>
                        </CCardBody>
                      </CCard>
                    </CCol>
                    <CCol sm={6}>
                      <CCard className="h-100 border-0 bg-body-tertiary">
                        <CCardBody>
                          <p className="mb-2 small fw-semibold text-body-secondary text-uppercase">Last Updated</p>
                          <p className="mb-0">{formatDateTime(selectedNode.last_synced_at)}</p>
                        </CCardBody>
                      </CCard>
                    </CCol>
                  </CRow>

                  <CCard className="border-0 bg-body-tertiary mt-4">
                    <CCardHeader className="bg-transparent fw-semibold">Assigned Security Profiles</CCardHeader>
                    <CCardBody>
                      {selectedNode.security_profiles.length ? (
                        <div className="d-flex flex-wrap gap-2">
                          {selectedNode.security_profiles.map((profileName) => (
                            <StatusBadge key={profileName} label={profileName} tone="info" />
                          ))}
                        </div>
                      ) : (
                        <p className="mb-0 text-body-secondary">No library-level security profiles are mapped yet.</p>
                      )}
                    </CCardBody>
                  </CCard>

                  <CCard className="border-0 bg-body-tertiary mt-4">
                    <CCardHeader className="d-flex flex-wrap align-items-center justify-content-between gap-2 bg-transparent">
                      <span className="fw-semibold">Children</span>
                      <CBadge color="secondary">{selectedNode.children.length} shown</CBadge>
                    </CCardHeader>
                    <CCardBody>
                      {selectedNode.children.length ? (
                        <div className="list-group">
                          {selectedNode.children.map((child) => (
                            <button
                              key={child.id}
                              type="button"
                              onClick={() => setSelectedNodeId(child.id)}
                              className="list-group-item list-group-item-action text-start"
                            >
                              <div className="d-flex align-items-start justify-content-between gap-3">
                                <div>
                                  <div className="fw-semibold">{child.name}</div>
                                  <div className="small text-body-secondary text-uppercase">{humanizeKey(child.node_type)}</div>
                                </div>
                                <StatusBadge label={humanizeKey(child.stage_status)} tone={stageTone(child.stage_status)} />
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="mb-0 text-body-secondary">No child items under the selected source.</p>
                      )}
                    </CCardBody>
                  </CCard>
                </>
              ) : null}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </div>
  );
}
