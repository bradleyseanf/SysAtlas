import type { ReactNode } from "react";
import { useDeferredValue, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Folder, FolderOpen, Search } from "lucide-react";
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
      <div key={node.id}>
        <div
          className={`flex items-center gap-2 rounded-2xl border px-3 py-2 transition ${
            isSelected
              ? "border-[rgba(201,74,99,0.22)] bg-[rgba(201,74,99,0.08)] text-atlas"
              : "border-transparent text-atlas-soft hover:border-[rgba(23,32,42,0.08)] hover:bg-white/72 hover:text-atlas"
          }`}
          style={{ paddingLeft: `${0.85 + depth * 1.05}rem` }}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={() => toggleNode(node.id)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-atlas-dim transition hover:bg-[rgba(23,32,42,0.05)] hover:text-atlas"
              aria-label={isExpanded ? `Collapse ${node.name}` : `Expand ${node.name}`}
            >
              <ChevronRight className={`h-4 w-4 transition ${isExpanded ? "rotate-90" : ""}`} />
            </button>
          ) : (
            <span className="block h-7 w-7" />
          )}

          <button type="button" onClick={() => setSelectedNodeId(node.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
            {hasChildren && isExpanded ? (
              <FolderOpen className="h-4 w-4 text-atlas-accent" />
            ) : (
              <Folder className="h-4 w-4 text-atlas-dim" />
            )}
            <span className="truncate text-sm font-medium">{node.name}</span>
          </button>

          <span className="hidden text-xs uppercase tracking-[0.14em] text-atlas-dim md:block">{humanizeKey(node.node_type)}</span>
        </div>

        {hasChildren && isExpanded ? <div className="mt-1 space-y-1">{node.children.map((child) => renderNode(child, depth + 1))}</div> : null}
      </div>
    );
  }

  if (librariesQuery.isLoading) {
    return (
      <section className="atlas-panel rounded-[28px] px-5 py-12 text-center text-sm text-atlas-muted">
        Loading library sources...
      </section>
    );
  }

  if (librariesQuery.isError) {
    return (
      <section className="atlas-error rounded-[28px] px-5 py-5 text-sm leading-6">
        {librariesQuery.error instanceof Error ? librariesQuery.error.message : "Unable to load libraries."}
      </section>
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
    <div className="space-y-6">
      {canManageIntegrations ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => navigate(withDevMode("/settings/integrations?module=libraries"))}
            className="atlas-primary-button rounded-2xl px-4 py-2.5 text-sm font-semibold"
          >
            Manage Sources
          </button>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.88fr)_minmax(320px,0.92fr)]">
        <section className="atlas-panel overflow-hidden rounded-[30px]">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[rgba(23,32,42,0.08)] px-5 py-4">
            <div>
              <p className="text-sm font-semibold text-atlas">Connected Library Sources</p>
              <p className="mt-1 text-sm text-atlas-muted">SharePoint and Teams sources appear here as integration sessions are linked.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="relative w-full min-w-[220px] max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-atlas-dim" />
                <input
                  className="atlas-field w-full rounded-2xl py-2.5 pl-10 pr-4 text-sm"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search sources"
                />
              </label>

              <button
                type="button"
                onClick={() => setExpandedNodeIds(expandableNodeIds)}
                className="atlas-secondary-button rounded-2xl px-4 py-2.5 text-sm font-semibold"
              >
                Expand
              </button>
              <button
                type="button"
                onClick={() => setExpandedNodeIds([])}
                className="atlas-secondary-button rounded-2xl px-4 py-2.5 text-sm font-semibold"
              >
                Collapse
              </button>
            </div>
          </div>

          <div className="max-h-[700px] overflow-auto px-4 py-4">
            {visibleItems.length ? (
              <div className="space-y-1">{visibleItems.map((node) => renderNode(node))}</div>
            ) : (
              <div className="rounded-3xl border border-dashed border-[rgba(23,32,42,0.12)] px-6 py-10 text-center text-sm text-atlas-muted">
                No connected library sources match the current search.
              </div>
            )}
          </div>
        </section>

        <section className="atlas-panel rounded-[30px] p-6">
          {selectedNode ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-atlas-accent-soft text-[0.74rem] font-semibold uppercase tracking-[0.18em]">{selectedNode.source}</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-atlas">{selectedNode.name}</h2>
                  <p className="mt-3 text-sm leading-7 text-atlas-muted">
                    {selectedNode.notes ?? "This source is available for library staging once connected integrations are ready."}
                  </p>
                </div>
                <StatusBadge label={humanizeKey(selectedNode.stage_status)} tone={stageTone(selectedNode.stage_status)} />
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <article className="atlas-panel-soft rounded-3xl p-4">
                  <p className="text-atlas-accent-soft text-[0.72rem] font-semibold uppercase tracking-[0.16em]">Path</p>
                  <p className="mt-2 text-sm font-medium text-atlas">{selectedNode.path}</p>
                </article>
                <article className="atlas-panel-soft rounded-3xl p-4">
                  <p className="text-atlas-accent-soft text-[0.72rem] font-semibold uppercase tracking-[0.16em]">Type</p>
                  <p className="mt-2 text-sm font-medium text-atlas">{humanizeKey(selectedNode.node_type)}</p>
                </article>
                <article className="atlas-panel-soft rounded-3xl p-4">
                  <p className="text-atlas-accent-soft text-[0.72rem] font-semibold uppercase tracking-[0.16em]">Visible Entries</p>
                  <p className="mt-2 text-sm font-medium text-atlas">{selectedNode.staged_item_count}</p>
                </article>
                <article className="atlas-panel-soft rounded-3xl p-4">
                  <p className="text-atlas-accent-soft text-[0.72rem] font-semibold uppercase tracking-[0.16em]">Last Updated</p>
                  <p className="mt-2 text-sm font-medium text-atlas">{formatDateTime(selectedNode.last_synced_at)}</p>
                </article>
              </div>

              <section className="atlas-panel-soft mt-6 rounded-[28px] p-5">
                <p className="text-sm font-semibold text-atlas">Assigned Security Profiles</p>
                {selectedNode.security_profiles.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedNode.security_profiles.map((profileName) => (
                      <StatusBadge key={profileName} label={profileName} tone="info" />
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-atlas-muted">No library-level security profiles are mapped yet.</p>
                )}
              </section>

              <section className="atlas-panel-soft mt-6 rounded-[28px] p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-atlas">Children</p>
                  <span className="text-xs uppercase tracking-[0.16em] text-atlas-dim">{selectedNode.children.length} shown</span>
                </div>

                {selectedNode.children.length ? (
                  <div className="mt-4 space-y-3">
                    {selectedNode.children.map((child) => (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => setSelectedNodeId(child.id)}
                        className="flex w-full items-center justify-between rounded-2xl border border-[rgba(23,32,42,0.08)] bg-white/72 px-4 py-3 text-left transition hover:border-[rgba(201,74,99,0.24)] hover:bg-white"
                      >
                        <span>
                          <span className="block text-sm font-semibold text-atlas">{child.name}</span>
                          <span className="mt-1 block text-xs uppercase tracking-[0.14em] text-atlas-dim">{humanizeKey(child.node_type)}</span>
                        </span>
                        <StatusBadge label={humanizeKey(child.stage_status)} tone={stageTone(child.stage_status)} />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-atlas-muted">No child items under the selected source.</p>
                )}
              </section>
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
}
