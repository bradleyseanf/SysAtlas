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

function isConnected(connection?: IntegrationConnection) {
  return connection?.status === "configured" || connection?.status === "connected";
}

function sessionExpiresLabel(_connection?: IntegrationConnection) {
  return "Not available";
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
      const configuredDelta = Number(isConnected(right.connection)) - Number(isConnected(left.connection));
      if (configuredDelta !== 0) {
        return configuredDelta;
      }

      return left.provider.name.localeCompare(right.provider.name);
    });

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

  function canCompleteConnection(providerId: string, connection?: IntegrationConnection) {
    return !isConnected(connection) && (launchReadyProviders[providerId] || connection?.status === "authorization_pending");
  }

  function handleLaunch(provider: IntegrationProvider, connection: IntegrationConnection | undefined) {
    const popup = window.open(provider.launch_url, `sysatlas-${provider.id}`, popupFeatures());
    if (!popup) {
      setNotice(`Allow pop-ups to open the ${provider.name} connection window.`);
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
        Integrations open in provider-hosted browser sessions. They only show as connected after the live provider link is saved here.
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
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[rgba(23,32,42,0.08)] px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-atlas">Integration Providers</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="atlas-pill rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
                    {providerRows.length} shown
                    {moduleFilter === "all" ? "" : ` in ${humanizeKey(moduleFilter)}`}
                  </span>
                  <span className="atlas-pill-accent rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
                    {connectedConnections.length} connected
                  </span>
                </div>
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
                {notice ? (
                  <div className="border-b border-[rgba(23,32,42,0.08)] px-5 py-4">
                    <div className="atlas-pill-accent rounded-[24px] px-4 py-3 text-sm">{notice}</div>
                  </div>
                ) : null}

                <div className="divide-y divide-[rgba(23,32,42,0.08)]">
                  {providerRows.map(({ provider, connection }) => {
                    const providerIsConnected = isConnected(connection);
                    const providerCanComplete = canCompleteConnection(provider.id, connection);

                    return (
                      <article key={provider.id} className="px-5 py-5 lg:px-6 lg:py-6">
                        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start gap-4">
                              <IntegrationLogo providerId={provider.id} providerName={provider.name} size="md" />
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-atlas-accent-soft text-[0.72rem] font-semibold uppercase tracking-[0.18em]">
                                    {provider.category}
                                  </p>
                                  <StatusBadge
                                    label={connection ? connectionLabel(connection.status) : "Not Connected"}
                                    tone={connection ? connectionTone(connection.status) : "neutral"}
                                  />
                                  {provider.supported_modules.map((moduleName) => (
                                    <StatusBadge key={moduleName} label={moduleName} tone="info" />
                                  ))}
                                </div>

                                <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-atlas">{provider.name}</h2>
                                <p className="mt-3 text-sm leading-7 text-atlas-muted">{provider.description}</p>
                              </div>
                            </div>

                            <div className="mt-5 grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                              <article className="atlas-panel-soft rounded-[22px] px-4 py-3">
                                <p className="text-atlas-accent-soft text-[0.72rem] font-semibold uppercase tracking-[0.16em]">
                                  Auth Strategy
                                </p>
                                <p className="mt-2 text-sm font-medium text-atlas">{humanizeKey(provider.auth_strategy)}</p>
                              </article>
                              <article className="atlas-panel-soft rounded-[22px] px-4 py-3">
                                <p className="text-atlas-accent-soft text-[0.72rem] font-semibold uppercase tracking-[0.16em]">
                                  Connection Label
                                </p>
                                <p className="mt-2 text-sm font-medium text-atlas">
                                  {connection?.tenant_label ?? defaultConnectionLabel(provider.name)}
                                </p>
                              </article>
                              <article className="atlas-panel-soft rounded-[22px] px-4 py-3">
                                <p className="text-atlas-accent-soft text-[0.72rem] font-semibold uppercase tracking-[0.16em]">
                                  Session Expires
                                </p>
                                <p className="mt-2 text-sm font-medium text-atlas">{sessionExpiresLabel(connection)}</p>
                              </article>
                              <article className="atlas-panel-soft rounded-[22px] px-4 py-3">
                                <p className="text-atlas-accent-soft text-[0.72rem] font-semibold uppercase tracking-[0.16em]">
                                  Last Updated
                                </p>
                                <p className="mt-2 text-sm font-medium text-atlas">{formatDateTime(connection?.updated_at ?? null)}</p>
                              </article>
                            </div>

                            <div className="mt-5 grid gap-4 2xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
                              <section className="atlas-panel-soft rounded-[24px] p-4">
                                <p className="text-sm font-semibold text-atlas">Connection Flow</p>
                                <ol className="mt-3 space-y-2">
                                  {provider.setup_steps.map((step, index) => (
                                    <li key={step} className="flex items-start gap-3 rounded-2xl bg-white/72 px-3 py-3">
                                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[rgba(201,74,99,0.08)] text-xs font-semibold text-[var(--atlas-accent-text)]">
                                        {index + 1}
                                      </span>
                                      <span className="text-sm leading-6 text-atlas-soft">{step}</span>
                                    </li>
                                  ))}
                                </ol>
                              </section>

                              <section className="atlas-panel-soft rounded-[24px] p-4">
                                <p className="text-sm font-semibold text-atlas">Security Notes</p>
                                <div className="mt-3 space-y-2">
                                  {provider.security_notes.map((note) => (
                                    <div
                                      key={note}
                                      className="rounded-2xl bg-white/72 px-3 py-3 text-sm leading-6 text-atlas-soft"
                                    >
                                      {note}
                                    </div>
                                  ))}
                                </div>
                              </section>
                            </div>
                          </div>

                          <div className="xl:w-[220px] xl:shrink-0">
                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                              <button
                                type="button"
                                onClick={() => handleLaunch(provider, connection)}
                                className="atlas-secondary-button rounded-2xl px-5 py-3 text-sm font-semibold"
                              >
                                Connection
                              </button>

                              {providerCanComplete ? (
                                <button
                                  type="button"
                                  onClick={() => saveProviderConnection(provider, connection)}
                                  className="atlas-primary-button rounded-2xl px-5 py-3 text-sm font-semibold"
                                >
                                  Connect
                                </button>
                              ) : null}

                              {provider.documentation_url ? (
                                <button
                                  type="button"
                                  onClick={() => window.open(provider.documentation_url ?? "", "_blank", "noopener,noreferrer")}
                                  className="atlas-secondary-button inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  Open Docs
                                </button>
                              ) : null}

                              {providerIsConnected ? (
                                <div className="atlas-note rounded-2xl px-4 py-3 text-sm leading-6">
                                  This provider is already connected and available to its assigned modules.
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}
