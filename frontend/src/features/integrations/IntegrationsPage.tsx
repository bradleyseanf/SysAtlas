import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Search } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { StatusBadge } from "../../components/StatusBadge";
import { api } from "../../lib/api";
import { formatDateTime, humanizeKey } from "../../lib/formatters";
import type { IntegrationConnection, IntegrationProvider } from "../../types/api";
import { IntegrationLogo } from "./integrationLogos";

type ModuleFilter = "all" | "libraries" | "users" | "devices";

const filterOptions: Array<{ id: ModuleFilter; label: string }> = [
  { id: "all", label: "All Integrations" },
  { id: "libraries", label: "Library Sources" },
  { id: "users", label: "User Sources" },
  { id: "devices", label: "Device Sources" },
];

function connectionTone(status: string) {
  if (status === "configured" || status === "connected") {
    return "positive" as const;
  }
  return "neutral" as const;
}

function connectionLabel(status: string) {
  if (status === "configured" || status === "connected") {
    return "Connected";
  }
  return "Not Connected";
}

function defaultConnectionLabel(providerName: string) {
  return `${providerName} Workspace`;
}

function popupFeatures() {
  const width = 720;
  const height = 760;
  const left = Math.max(0, Math.round((window.screen.width - width) / 2));
  const top = Math.max(0, Math.round((window.screen.height - height) / 2));
  return `popup=yes,width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`;
}

export function IntegrationsPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedProviderId, setSelectedProviderId] = useState("");
  const [providerSearch, setProviderSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [launchReadyProviders, setLaunchReadyProviders] = useState<Record<string, boolean>>({});
  const launchWatchersRef = useRef<Record<string, number>>({});

  const moduleFilter = (searchParams.get("module") as ModuleFilter | null) ?? "all";

  const catalogQuery = useQuery({
    queryKey: ["integrations", "catalog"],
    queryFn: api.getIntegrationCatalog,
  });

  const connectionsQuery = useQuery({
    queryKey: ["integrations", "connections"],
    queryFn: api.getIntegrations,
  });

  const saveMutation = useMutation({
    mutationFn: api.saveIntegration,
    onSuccess: async (response) => {
      setNotice(response.message);
      await queryClient.invalidateQueries({ queryKey: ["integrations"] });
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      await queryClient.invalidateQueries({ queryKey: ["devices"] });
    },
    onError: (mutationError) => {
      setNotice(mutationError instanceof Error ? mutationError.message : "Unable to save the integration.");
    },
  });

  useEffect(() => {
    return () => {
      Object.values(launchWatchersRef.current).forEach((watcher) => window.clearInterval(watcher));
    };
  }, []);

  const allConnections = connectionsQuery.data?.items ?? [];
  const connectedConnections = allConnections.filter(
    (item) => item.status === "configured" || item.status === "connected"
  );
  const allConnectionMap = new Map(allConnections.map((item) => [item.provider, item]));

  const moduleFilteredProviders = (() => {
    const providers = catalogQuery.data?.providers ?? [];
    if (moduleFilter === "all") {
      return providers;
    }
    return providers.filter((provider) => provider.supported_modules.includes(moduleFilter));
  })();

  const normalizedProviderSearch = providerSearch.trim().toLowerCase();

  const providerRows = moduleFilteredProviders
    .map((provider) => ({
      provider,
      connection: allConnectionMap.get(provider.id),
    }))
    .filter(({ provider, connection }) => {
      if (!normalizedProviderSearch) {
        return true;
      }

      const searchHaystack = [
        provider.name,
        provider.category,
        provider.description,
        humanizeKey(provider.auth_strategy),
        humanizeKey(provider.setup_mode),
        provider.supported_modules.map(humanizeKey).join(" "),
        connection?.tenant_label ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return searchHaystack.includes(normalizedProviderSearch);
    })
    .sort((left, right) => {
      const configuredDelta =
        Number(right.connection?.status === "configured" || right.connection?.status === "connected") -
        Number(left.connection?.status === "configured" || left.connection?.status === "connected");
      if (configuredDelta !== 0) {
        return configuredDelta;
      }

      return left.provider.name.localeCompare(right.provider.name);
    });

  useEffect(() => {
    if (!providerRows.length) {
      setSelectedProviderId("");
      return;
    }

    if (providerRows.some(({ provider }) => provider.id === selectedProviderId)) {
      return;
    }

    setSelectedProviderId(providerRows[0].provider.id);
  }, [providerRows, selectedProviderId]);

  const activeProviderRow = providerRows.find(({ provider }) => provider.id === selectedProviderId) ?? providerRows[0];
  const selectedProvider = activeProviderRow?.provider;
  const selectedConnection = activeProviderRow?.connection;
  const selectedProviderIsConnected =
    selectedConnection?.status === "configured" || selectedConnection?.status === "connected";
  const canCompleteSelectedConnection =
    Boolean(selectedProvider) &&
    !selectedProviderIsConnected &&
    ((selectedProvider ? launchReadyProviders[selectedProvider.id] : false) ||
      selectedConnection?.status === "authorization_pending");

  function handleFilterChange(nextFilter: ModuleFilter) {
    if (nextFilter === "all") {
      setSearchParams({});
      return;
    }

    setSearchParams({ module: nextFilter });
  }

  function saveProviderConnection(provider: IntegrationProvider, connection?: IntegrationConnection) {
    saveMutation.mutate({
      provider: provider.id,
      tenant_label: connection?.tenant_label ?? defaultConnectionLabel(provider.name),
      config: {},
      status: "configured",
    });
  }

  function handleLaunch(provider: IntegrationProvider, connection: IntegrationConnection | undefined) {
    const popup = window.open(provider.launch_url, `sysatlas-${provider.id}`, popupFeatures());
    if (!popup) {
      setNotice(`Allow pop-ups to launch the ${provider.name} session.`);
      return;
    }

    popup.focus();
    setNotice(`${provider.name} opened in a secure provider session. Finish sign-in there, then return here to connect it.`);
    setLaunchReadyProviders((current) => ({ ...current, [provider.id]: false }));

    const existingWatcher = launchWatchersRef.current[provider.id];
    if (existingWatcher) {
      window.clearInterval(existingWatcher);
    }

    launchWatchersRef.current[provider.id] = window.setInterval(() => {
      if (!popup.closed) {
        return;
      }

      const watcher = launchWatchersRef.current[provider.id];
      if (watcher) {
        window.clearInterval(watcher);
        delete launchWatchersRef.current[provider.id];
      }

      setLaunchReadyProviders((current) => ({ ...current, [provider.id]: true }));
      setNotice(`${provider.name} session closed. If access was granted, connect it here.`);
    }, 500);
  }

  return (
    <div className="space-y-6">
      <section className="atlas-note rounded-[28px] p-5 text-sm leading-7">
        Integrations launch in provider-hosted browser sessions. They only show as connected after the live provider link is saved here.
      </section>

      <div className="flex flex-wrap gap-3">
        {filterOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => handleFilterChange(option.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              moduleFilter === option.id ? "atlas-pill-accent" : "atlas-secondary-button text-atlas-soft"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {connectionsQuery.isLoading || catalogQuery.isLoading ? (
        <section className="atlas-panel rounded-[28px] px-5 py-12 text-center text-sm text-atlas-muted">
          Loading integration catalog...
        </section>
      ) : connectionsQuery.isError || catalogQuery.isError ? (
        <section className="atlas-error rounded-[28px] px-5 py-5 text-sm leading-6">
          {connectionsQuery.error instanceof Error
            ? connectionsQuery.error.message
            : catalogQuery.error instanceof Error
              ? catalogQuery.error.message
              : "Unable to load integrations."}
        </section>
      ) : (
        <>
          <section className="atlas-panel overflow-hidden rounded-[30px]">
            <div className="flex items-center justify-between border-b border-[rgba(23,32,42,0.08)] px-6 py-4">
              <div>
                <p className="text-sm font-semibold text-atlas">Connected Providers</p>
                <p className="mt-1 text-sm text-atlas-muted">External providers with a saved, active integration.</p>
              </div>
              <span className="atlas-pill rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
                {connectedConnections.length} connected
              </span>
            </div>

            {connectedConnections.length === 0 ? (
              <div className="px-6 py-10 text-sm text-atlas-muted">No integrations connected yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left">
                  <thead className="atlas-table-head text-[0.74rem] font-semibold uppercase tracking-[0.18em]">
                    <tr>
                      <th className="px-6 py-4">Provider</th>
                      <th className="px-6 py-4">Connection</th>
                      <th className="px-6 py-4">Modules</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {connectedConnections.map((connection) => (
                      <tr key={connection.id} className="atlas-table-row border-t border-[rgba(23,32,42,0.06)] text-sm">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <IntegrationLogo providerId={connection.provider} providerName={connection.provider_name} size="sm" />
                            <div>
                              <p className="font-semibold text-atlas">{connection.provider_name}</p>
                              <p className="mt-1 text-atlas-muted">{connection.category}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-atlas">{connection.tenant_label}</p>
                          <p className="mt-1 text-atlas-muted">{humanizeKey(connection.auth_strategy)}</p>
                        </td>
                        <td className="px-6 py-4 text-atlas-muted">{connection.supported_modules.map(humanizeKey).join(", ")}</td>
                        <td className="px-6 py-4">
                          <StatusBadge label={connectionLabel(connection.status)} tone={connectionTone(connection.status)} />
                        </td>
                        <td className="px-6 py-4">{formatDateTime(connection.updated_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="atlas-panel overflow-hidden rounded-[30px]">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[rgba(23,32,42,0.08)] px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-atlas">Available Providers</p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-atlas-dim">
                  {providerRows.length} shown
                  {moduleFilter === "all" ? "" : ` in ${humanizeKey(moduleFilter)}`}
                </p>
              </div>

              <label className="relative w-full max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-atlas-dim" />
                <input
                  className="atlas-field w-full rounded-2xl py-2.5 pl-10 pr-4 text-sm"
                  value={providerSearch}
                  onChange={(event) => setProviderSearch(event.target.value)}
                  placeholder="Search integrations"
                />
              </label>
            </div>

            {providerRows.length === 0 ? (
              <div className="px-6 py-10 text-sm text-atlas-muted">No integrations match the current filter.</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full table-fixed border-collapse text-left">
                    <thead className="atlas-table-head text-[0.7rem] font-semibold uppercase tracking-[0.18em]">
                      <tr>
                        <th className="w-[18rem] px-4 py-3">Integration</th>
                        <th className="w-[10rem] px-4 py-3">Category</th>
                        <th className="w-[12rem] px-4 py-3">Modules</th>
                        <th className="w-[11rem] px-4 py-3">Setup</th>
                        <th className="w-[10rem] px-4 py-3">Status</th>
                        <th className="w-[10rem] px-4 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {providerRows.map(({ provider, connection }) => {
                        const isSelected = selectedProvider?.id === provider.id;

                        return (
                          <tr
                            key={provider.id}
                            onClick={() => setSelectedProviderId(provider.id)}
                            className={`cursor-pointer border-t border-[rgba(23,32,42,0.06)] text-sm transition ${
                              isSelected ? "bg-[rgba(201,74,99,0.06)]" : "atlas-table-row hover:bg-[rgba(23,32,42,0.03)]"
                            }`}
                          >
                            <td className="px-4 py-4">
                              <div className="flex items-start gap-3">
                                <IntegrationLogo providerId={provider.id} providerName={provider.name} size="sm" />
                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-atlas">{provider.name}</p>
                                  <p className="mt-1 truncate text-xs text-atlas-dim">{provider.description}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-atlas-muted">{provider.category}</td>
                            <td className="px-4 py-4 text-atlas-muted">{provider.supported_modules.map(humanizeKey).join(", ")}</td>
                            <td className="px-4 py-4 text-atlas-muted">{humanizeKey(provider.setup_mode)}</td>
                            <td className="px-4 py-4">
                              <StatusBadge
                                label={connection ? connectionLabel(connection.status) : "Not Connected"}
                                tone={connection ? connectionTone(connection.status) : "neutral"}
                              />
                            </td>
                            <td className="px-4 py-4">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleLaunch(provider, connection);
                                }}
                                className="atlas-secondary-button rounded-2xl px-4 py-2 text-sm font-semibold"
                              >
                                Launch
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {selectedProvider ? (
                  <div className="border-t border-[rgba(23,32,42,0.08)] px-6 py-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <IntegrationLogo providerId={selectedProvider.id} providerName={selectedProvider.name} size="lg" />
                        <div>
                          <p className="text-atlas-accent-soft text-[0.74rem] font-semibold uppercase tracking-[0.18em]">
                            {selectedProvider.category}
                          </p>
                          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-atlas">{selectedProvider.name}</h2>
                          <p className="mt-3 max-w-3xl text-sm leading-7 text-atlas-muted">{selectedProvider.description}</p>
                          <p className="mt-3 text-xs uppercase tracking-[0.18em] text-atlas-dim">
                            Auth Strategy: {humanizeKey(selectedProvider.auth_strategy)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {selectedProvider.supported_modules.map((moduleName) => (
                          <StatusBadge key={moduleName} label={moduleName} tone="info" />
                        ))}
                        <StatusBadge
                          label={selectedConnection ? connectionLabel(selectedConnection.status) : "Not Connected"}
                          tone={selectedConnection ? connectionTone(selectedConnection.status) : "neutral"}
                        />
                      </div>
                    </div>

                    {notice ? <div className="atlas-pill-accent mt-5 rounded-[24px] px-4 py-3 text-sm">{notice}</div> : null}

                    <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
                      <section className="atlas-panel-soft rounded-[28px] p-5">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-atlas">Connection Flow</p>
                          <span className="text-xs uppercase tracking-[0.16em] text-atlas-dim">{humanizeKey(selectedProvider.setup_mode)}</span>
                        </div>

                        <ol className="mt-4 space-y-3">
                          {selectedProvider.setup_steps.map((step, index) => (
                            <li key={step} className="flex items-start gap-3 rounded-2xl border border-[rgba(23,32,42,0.08)] bg-white/72 px-4 py-4">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[rgba(201,74,99,0.08)] text-sm font-semibold text-[var(--atlas-accent-text)]">
                                {index + 1}
                              </span>
                              <span className="text-sm leading-6 text-atlas-soft">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </section>

                      <section className="space-y-5">
                        <section className="atlas-panel-soft rounded-[28px] p-5">
                          <p className="text-sm font-semibold text-atlas">Security Notes</p>
                          <div className="mt-4 space-y-3">
                            {selectedProvider.security_notes.map((note) => (
                              <div key={note} className="rounded-2xl border border-[rgba(23,32,42,0.08)] bg-white/72 px-4 py-4 text-sm leading-6 text-atlas-soft">
                                {note}
                              </div>
                            ))}
                          </div>
                        </section>

                        <section className="atlas-panel-soft rounded-[28px] p-5">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <article>
                              <p className="text-atlas-accent-soft text-[0.72rem] font-semibold uppercase tracking-[0.16em]">Connection Label</p>
                              <p className="mt-2 text-sm font-medium text-atlas">
                                {selectedConnection?.tenant_label ?? defaultConnectionLabel(selectedProvider.name)}
                              </p>
                            </article>
                            <article>
                              <p className="text-atlas-accent-soft text-[0.72rem] font-semibold uppercase tracking-[0.16em]">Last Updated</p>
                              <p className="mt-2 text-sm font-medium text-atlas">{formatDateTime(selectedConnection?.updated_at ?? null)}</p>
                            </article>
                          </div>

                          <div className="mt-5 flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={() => handleLaunch(selectedProvider, selectedConnection)}
                              className="atlas-primary-button rounded-2xl px-5 py-3 text-sm font-semibold"
                            >
                              {selectedProvider.launch_button_label}
                            </button>

                            {selectedProvider.documentation_url ? (
                              <button
                                type="button"
                                onClick={() => window.open(selectedProvider.documentation_url ?? "", "_blank", "noopener,noreferrer")}
                                className="atlas-secondary-button inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold"
                              >
                                <ExternalLink className="h-4 w-4" />
                                Open Docs
                              </button>
                            ) : null}

                            {canCompleteSelectedConnection ? (
                              <button
                                type="button"
                                onClick={() => saveProviderConnection(selectedProvider, selectedConnection)}
                                className="atlas-secondary-button rounded-2xl px-5 py-3 text-sm font-semibold"
                              >
                                Connect Integration
                              </button>
                            ) : null}
                          </div>
                        </section>
                      </section>
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}
