import { useEffect, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { StatusBadge } from "../../components/StatusBadge";
import { api } from "../../lib/api";
import { formatDateTime, humanizeKey } from "../../lib/formatters";
import type { IntegrationConnection, IntegrationProvider } from "../../types/api";
import { IntegrationLogo } from "./integrationLogos";

type ModuleFilter = "all" | "users" | "devices";

type FormState = {
  tenant_label: string;
  config: Record<string, string>;
};

const filterOptions: Array<{ id: ModuleFilter; label: string }> = [
  { id: "all", label: "All Integrations" },
  { id: "users", label: "User Sources" },
  { id: "devices", label: "Device Sources" },
];

function buildFormState(provider: IntegrationProvider, connection: IntegrationConnection | undefined): FormState {
  const configEntries = provider.fields.reduce<Record<string, string>>((result, field) => {
    result[field.key] = field.secret ? "" : connection?.config_preview[field.key] ?? "";
    return result;
  }, {});

  return {
    tenant_label: connection?.tenant_label ?? "",
    config: configEntries,
  };
}

export function IntegrationsPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedProviderId, setSelectedProviderId] = useState("");
  const [providerSearch, setProviderSearch] = useState("");
  const [formState, setFormState] = useState<FormState>({ tenant_label: "", config: {} });
  const [notice, setNotice] = useState("");

  const moduleFilter = (searchParams.get("module") as ModuleFilter | null) ?? "all";

  const catalogQuery = useQuery({
    queryKey: ["integrations", "catalog"],
    queryFn: api.getIntegrationCatalog,
  });

  const connectionsQuery = useQuery({
    queryKey: ["integrations", "connections"],
    queryFn: api.getIntegrations,
  });

  const configuredConnections = connectionsQuery.data?.items ?? [];
  const configuredConnectionMap = new Map(configuredConnections.map((item) => [item.provider, item]));

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
      connection: configuredConnectionMap.get(provider.id),
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
        provider.supported_modules.map(humanizeKey).join(" "),
        connection?.tenant_label ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return searchHaystack.includes(normalizedProviderSearch);
    })
    .sort((left, right) => {
      const configuredDelta = Number(Boolean(right.connection)) - Number(Boolean(left.connection));
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

  useEffect(() => {
    if (!selectedProvider) {
      return;
    }
    setFormState(buildFormState(selectedProvider, selectedConnection));
  }, [selectedConnection, selectedProvider]);

  useEffect(() => {
    setNotice("");
  }, [selectedProviderId]);

  const saveMutation = useMutation({
    mutationFn: api.saveIntegration,
    onSuccess: (response) => {
      setNotice(response.message);
      void queryClient.invalidateQueries({ queryKey: ["integrations"] });
      void queryClient.invalidateQueries({ queryKey: ["users"] });
      void queryClient.invalidateQueries({ queryKey: ["devices"] });
    },
    onError: (mutationError) => {
      setNotice(mutationError instanceof Error ? mutationError.message : "Unable to save the integration.");
    },
  });

  function handleFilterChange(nextFilter: ModuleFilter) {
    if (nextFilter === "all") {
      setSearchParams({});
      return;
    }

    setSearchParams({ module: nextFilter });
  }

  function handleTenantLabelChange(event: ChangeEvent<HTMLInputElement>) {
    const { value } = event.target;
    setFormState((current) => ({ ...current, tenant_label: value }));
  }

  function handleFieldChange(fieldKey: string, value: string) {
    setFormState((current) => ({
      ...current,
      config: {
        ...current.config,
        [fieldKey]: value,
      },
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProvider) {
      return;
    }

    setNotice("");
    saveMutation.mutate({
      provider: selectedProvider.id,
      tenant_label: formState.tenant_label,
      config: formState.config,
      status: "configured",
    });
  }

  function handleProviderRowKeyDown(event: KeyboardEvent<HTMLTableRowElement>, providerId: string) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    setSelectedProviderId(providerId);
  }

  return (
    <div className="space-y-6">
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
          <section className="atlas-panel overflow-hidden rounded-[28px]">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <p className="text-sm font-semibold text-atlas">Configured Connections</p>
              <span className="atlas-pill rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
                {configuredConnections.length} configured
              </span>
            </div>

            {configuredConnections.length === 0 ? (
              <div className="px-6 py-10 text-sm text-atlas-muted">No integrations configured yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left">
                  <thead className="atlas-table-head text-[0.74rem] font-semibold uppercase tracking-[0.18em]">
                    <tr>
                      <th className="px-6 py-4">Provider</th>
                      <th className="px-6 py-4">Connection</th>
                      <th className="px-6 py-4">Modules</th>
                      <th className="px-6 py-4">Configured Fields</th>
                      <th className="px-6 py-4">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {configuredConnections.map((connection) => (
                      <tr key={connection.id} className="atlas-table-row border-t border-white/6 text-sm">
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
                        <td className="px-6 py-4 text-atlas-muted">
                          {connection.supported_modules.map(humanizeKey).join(", ")}
                        </td>
                        <td className="px-6 py-4">{connection.configured_fields.length}</td>
                        <td className="px-6 py-4">{formatDateTime(connection.updated_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(380px,0.95fr)]">
            <section className="atlas-panel overflow-hidden rounded-[28px]">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
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
                <div className="max-h-[620px] overflow-auto">
                  <table className="min-w-full table-fixed border-collapse text-left">
                    <thead className="sticky top-0 z-10 bg-[rgba(248,245,240,0.96)] text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-atlas-dim">
                      <tr>
                        <th className="w-14 px-4 py-3">Sel</th>
                        <th className="px-4 py-3">Integration</th>
                        <th className="w-[8.5rem] px-4 py-3">Category</th>
                        <th className="w-[10rem] px-4 py-3">Modules</th>
                        <th className="w-[8rem] px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {providerRows.map(({ provider, connection }) => {
                        const isSelected = selectedProvider?.id === provider.id;

                        return (
                          <tr
                            key={provider.id}
                            tabIndex={0}
                            aria-selected={isSelected}
                            onClick={() => setSelectedProviderId(provider.id)}
                            onKeyDown={(event) => handleProviderRowKeyDown(event, provider.id)}
                            className={`group cursor-pointer border-t border-white/6 text-sm outline-none transition ${
                              isSelected
                                ? "bg-[rgba(23,32,42,0.05)] text-atlas"
                                : "atlas-table-row hover:bg-[rgba(23,32,42,0.03)] focus-visible:bg-[rgba(23,32,42,0.04)]"
                            }`}
                          >
                            <td className="px-4 py-4 align-top">
                              <span
                                className={`flex h-4 w-4 items-center justify-center rounded-[4px] border transition ${
                                  isSelected
                                    ? "border-[var(--atlas-accent)] bg-[var(--atlas-accent)]"
                                    : "border-[rgba(23,32,42,0.12)] bg-[rgba(23,32,42,0.03)] group-hover:border-[rgba(23,32,42,0.22)]"
                                }`}
                              >
                                {isSelected ? <span className="h-1.5 w-1.5 rounded-[2px] bg-white" /> : null}
                              </span>
                            </td>
                            <td className="px-4 py-4 align-top">
                              <div className="flex items-start gap-3">
                                <IntegrationLogo providerId={provider.id} providerName={provider.name} size="sm" />
                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-atlas">{provider.name}</p>
                                  <p className="mt-1 truncate text-xs text-atlas-dim">
                                    {connection?.tenant_label ?? provider.description}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 align-top text-atlas-muted">{provider.category}</td>
                            <td className="px-4 py-4 align-top text-atlas-muted">
                              {provider.supported_modules.map(humanizeKey).join(", ")}
                            </td>
                            <td className="px-4 py-4 align-top">
                              <span
                                className={`inline-flex items-center gap-2 font-medium ${
                                  connection ? "text-[var(--atlas-success-text)]" : "text-atlas-muted"
                                }`}
                              >
                                <span className={`h-2 w-2 rounded-full ${connection ? "bg-[#70d89b]" : "bg-white/28"}`} />
                                {connection ? "Configured" : "Ready"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="atlas-panel rounded-[28px] p-6">
              {selectedProvider ? (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <IntegrationLogo providerId={selectedProvider.id} providerName={selectedProvider.name} size="lg" />
                      <div>
                        <p className="text-atlas-dim text-[0.74rem] font-semibold uppercase tracking-[0.18em]">
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
                    </div>
                  </div>

                  {notice ? <div className="atlas-pill-accent mt-5 rounded-[24px] px-4 py-3 text-sm">{notice}</div> : null}

                  <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-atlas-soft">Connection Label</span>
                      <input
                        className="atlas-field w-full rounded-2xl px-4 py-3"
                        value={formState.tenant_label}
                        onChange={handleTenantLabelChange}
                        placeholder={`${selectedProvider.name} - Production`}
                        required
                      />
                    </label>

                    <div className="grid gap-5 lg:grid-cols-2">
                      {selectedProvider.fields.map((field) => {
                        const secretConfigured = selectedConnection?.configured_secret_fields.includes(field.key) ?? false;
                        const isTextArea = field.input_type === "textarea";

                        return (
                          <label key={field.key} className={`block ${isTextArea ? "lg:col-span-2" : ""}`}>
                            <span className="mb-2 block text-sm font-medium text-atlas-soft">{field.label}</span>
                            {isTextArea ? (
                              <textarea
                                className="atlas-field min-h-[120px] w-full rounded-2xl px-4 py-3"
                                value={formState.config[field.key] ?? ""}
                                onChange={(event) => handleFieldChange(field.key, event.target.value)}
                                placeholder={field.placeholder ?? ""}
                                required={field.required && !secretConfigured}
                              />
                            ) : (
                              <input
                                className="atlas-field w-full rounded-2xl px-4 py-3"
                                type={field.input_type}
                                value={formState.config[field.key] ?? ""}
                                onChange={(event) => handleFieldChange(field.key, event.target.value)}
                                placeholder={
                                  field.secret && secretConfigured
                                    ? "Saved securely. Enter a new value to replace it."
                                    : field.placeholder ?? ""
                                }
                                required={field.required && !secretConfigured}
                              />
                            )}
                          </label>
                        );
                      })}
                    </div>

                    <button
                      type="submit"
                      disabled={saveMutation.isPending}
                      className="atlas-primary-button rounded-2xl px-5 py-3 text-sm font-semibold"
                    >
                      {saveMutation.isPending ? "Saving Integration..." : selectedConnection ? "Update Integration" : "Save Integration"}
                    </button>
                  </form>
                </>
              ) : (
                <div className="px-2 py-8 text-sm text-atlas-muted">No providers available for the selected filter.</div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
