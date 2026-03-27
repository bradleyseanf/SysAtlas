import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { StatusBadge } from "../../components/StatusBadge";
import { api } from "../../lib/api";
import { formatDateTime, humanizeKey } from "../../lib/formatters";
import type { IntegrationConnection, IntegrationProvider } from "../../types/api";

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

function findConnection(providerId: string, items: IntegrationConnection[]) {
  return items.find((item) => item.provider === providerId);
}

export function IntegrationsPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedProviderId, setSelectedProviderId] = useState("");
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

  const visibleProviders = (() => {
    const providers = catalogQuery.data?.providers ?? [];
    if (moduleFilter === "all") {
      return providers;
    }
    return providers.filter((provider) => provider.supported_modules.includes(moduleFilter));
  })();

  useEffect(() => {
    if (!visibleProviders.length) {
      setSelectedProviderId("");
      return;
    }

    if (visibleProviders.some((provider) => provider.id === selectedProviderId)) {
      return;
    }

    setSelectedProviderId(visibleProviders[0].id);
  }, [selectedProviderId, visibleProviders]);

  const selectedProvider = visibleProviders.find((provider) => provider.id === selectedProviderId) ?? visibleProviders[0];
  const selectedConnection =
    selectedProvider && connectionsQuery.data ? findConnection(selectedProvider.id, connectionsQuery.data.items) : undefined;

  useEffect(() => {
    if (!selectedProvider) {
      return;
    }
    setFormState(buildFormState(selectedProvider, selectedConnection));
  }, [selectedConnection, selectedProvider]);

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

  const configuredConnections = connectionsQuery.data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        {filterOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => handleFilterChange(option.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              moduleFilter === option.id
                ? "border border-[#df6f87]/35 bg-[#c73e59] text-white"
                : "border border-white/10 bg-[rgba(255,255,255,0.05)] text-[#f3dce1]/78 hover:border-[#df6f87]/30 hover:bg-[rgba(255,255,255,0.08)]"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {connectionsQuery.isLoading || catalogQuery.isLoading ? (
        <section className="rounded-[28px] border border-white/10 bg-[rgba(29,16,21,0.76)] px-5 py-12 text-center text-sm text-[#f3dce1]/72 backdrop-blur-[12px]">
          Loading integration catalog...
        </section>
      ) : connectionsQuery.isError || catalogQuery.isError ? (
        <section className="rounded-[28px] border border-[#d55472]/30 bg-[rgba(123,30,52,0.18)] px-5 py-5 text-sm leading-6 text-[#fde6eb]">
          {connectionsQuery.error instanceof Error
            ? connectionsQuery.error.message
            : catalogQuery.error instanceof Error
              ? catalogQuery.error.message
              : "Unable to load integrations."}
        </section>
      ) : (
        <>
          <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[rgba(29,16,21,0.76)] shadow-[0_22px_50px_rgba(8,4,6,0.28)] backdrop-blur-[12px]">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <p className="text-sm font-semibold text-[#fff7f8]">Configured Connections</p>
              <span className="rounded-full border border-[#df6f87]/25 bg-[rgba(215,84,114,0.12)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#f2c8d1]">
                {configuredConnections.length} configured
              </span>
            </div>

            {configuredConnections.length === 0 ? (
              <div className="px-6 py-10 text-sm text-[#f3dce1]/72">No integrations configured yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left">
                  <thead className="bg-[rgba(255,255,255,0.04)] text-[0.74rem] font-semibold uppercase tracking-[0.18em] text-[#d2bac0]">
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
                      <tr key={connection.id} className="border-t border-white/6 text-sm text-[#f0dde1]/82">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-[#fff7f8]">{connection.provider_name}</p>
                          <p className="mt-1 text-[#f3dce1]/72">{connection.category}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-[#fff7f8]">{connection.tenant_label}</p>
                          <p className="mt-1 text-[#f3dce1]/72">{humanizeKey(connection.auth_strategy)}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            {connection.supported_modules.map((moduleName) => (
                              <StatusBadge key={moduleName} label={moduleName} tone="info" />
                            ))}
                          </div>
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

          <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
            <section className="rounded-[28px] border border-white/10 bg-[rgba(29,16,21,0.76)] p-5 shadow-[0_22px_50px_rgba(8,4,6,0.28)] backdrop-blur-[12px]">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[#fff7f8]">Available Providers</p>
              </div>

              <div className="mt-5 space-y-3">
                {visibleProviders.map((provider) => {
                  const connection = configuredConnections.find((item) => item.provider === provider.id);
                  const isSelected = selectedProvider?.id === provider.id;

                  return (
                    <button
                      key={provider.id}
                      type="button"
                      onClick={() => setSelectedProviderId(provider.id)}
                      className={`w-full rounded-[24px] border px-4 py-4 text-left transition ${
                        isSelected
                          ? "border-[#df6f87]/35 bg-[rgba(199,62,89,0.14)]"
                          : "border-white/10 bg-[rgba(255,255,255,0.04)] hover:border-[#df6f87]/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-[#fff7f8]">{provider.name}</p>
                        <StatusBadge label={connection ? "Configured" : "Ready"} tone={connection ? "positive" : "neutral"} />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {provider.supported_modules.map((moduleName) => (
                          <StatusBadge key={moduleName} label={moduleName} tone="info" />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[28px] border border-white/10 bg-[rgba(29,16,21,0.76)] p-6 shadow-[0_22px_50px_rgba(8,4,6,0.28)] backdrop-blur-[12px]">
              {selectedProvider ? (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-[0.74rem] font-semibold uppercase tracking-[0.18em] text-[#d55472]">{selectedProvider.category}</p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#fff7f8]">{selectedProvider.name}</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedProvider.supported_modules.map((moduleName) => (
                        <StatusBadge key={moduleName} label={moduleName} tone="info" />
                      ))}
                    </div>
                  </div>

                  {notice ? (
                    <div className="mt-5 rounded-[24px] border border-[#df6f87]/25 bg-[rgba(199,62,89,0.16)] px-4 py-3 text-sm text-[#ffdbe1]">{notice}</div>
                  ) : null}

                  <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-[#f3dce1]">Connection Label</span>
                      <input
                        className="w-full rounded-2xl border border-[#6d3d47] bg-[rgba(90,39,49,0.34)] px-4 py-3 text-[#f8edf0] outline-none transition placeholder:text-[#cfaeb6]/40 focus:border-[#d55472] focus:bg-[rgba(98,40,51,0.46)]"
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
                            <span className="mb-2 block text-sm font-medium text-[#f3dce1]">{field.label}</span>
                            {isTextArea ? (
                              <textarea
                                className="min-h-[120px] w-full rounded-2xl border border-[#6d3d47] bg-[rgba(90,39,49,0.34)] px-4 py-3 text-[#f8edf0] outline-none transition placeholder:text-[#cfaeb6]/40 focus:border-[#d55472] focus:bg-[rgba(98,40,51,0.46)]"
                                value={formState.config[field.key] ?? ""}
                                onChange={(event) => handleFieldChange(field.key, event.target.value)}
                                placeholder={field.placeholder ?? ""}
                                required={field.required && !secretConfigured}
                              />
                            ) : (
                              <input
                                className="w-full rounded-2xl border border-[#6d3d47] bg-[rgba(90,39,49,0.34)] px-4 py-3 text-[#f8edf0] outline-none transition placeholder:text-[#cfaeb6]/40 focus:border-[#d55472] focus:bg-[rgba(98,40,51,0.46)]"
                                type={field.input_type}
                                value={formState.config[field.key] ?? ""}
                                onChange={(event) => handleFieldChange(field.key, event.target.value)}
                                placeholder={field.secret && secretConfigured ? "Saved securely. Enter a new value to replace it." : field.placeholder ?? ""}
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
                      className="rounded-2xl border border-[#df6f87]/35 bg-[#c73e59] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#d55472] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {saveMutation.isPending ? "Saving Integration..." : selectedConnection ? "Update Integration" : "Save Integration"}
                    </button>
                  </form>
                </>
              ) : (
                <div className="px-2 py-8 text-sm text-[#f3dce1]/72">No providers available for the selected filter.</div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
