import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CAlert, CBadge, CButton, CCard, CCardBody, CCardHeader, CFormInput, CInputGroup, CInputGroupText, CSpinner, CTable } from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilSearch } from "@coreui/icons";
import { useLocation, useSearchParams } from "react-router-dom";

import { StatusBadge } from "../../components/StatusBadge";
import { API_BASE_URL, api, buildApiUrl } from "../../lib/api";
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

function popupFeatures() {
  const width = 720;
  const height = 760;
  const left = Math.max(0, Math.round((window.screen.width - width) / 2));
  const top = Math.max(0, Math.round((window.screen.height - height) / 2));
  return `popup=yes,width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`;
}

type IntegrationOauthMessage = {
  type: string;
  provider: string;
  success: boolean;
  message: string;
};

export function IntegrationsPage() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [providerSearch, setProviderSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeColor, setNoticeColor] = useState<"info" | "success" | "warning" | "danger">("info");

  const moduleFilter = (searchParams.get("module") as ModuleFilter | null) ?? "all";

  const catalogQuery = useQuery({
    queryKey: ["integrations", "catalog"],
    queryFn: api.getIntegrationCatalog,
  });

  const connectionsQuery = useQuery({
    queryKey: ["integrations", "connections"],
    queryFn: api.getIntegrations,
  });

  useEffect(() => {
    const apiOrigin = new URL(API_BASE_URL).origin;

    function handleOauthMessage(event: MessageEvent<IntegrationOauthMessage>) {
      if (event.origin !== apiOrigin || typeof event.data !== "object" || event.data === null) {
        return;
      }

      if (event.data.type !== "sysatlas.integration.oauth") {
        return;
      }

      setNoticeColor(event.data.success ? "success" : "danger");
      setNotice(event.data.message);

      if (!event.data.success) {
        return;
      }

      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ["integrations"] }),
        queryClient.invalidateQueries({ queryKey: ["users"] }),
        queryClient.invalidateQueries({ queryKey: ["devices"] }),
      ]);
    }

    window.addEventListener("message", handleOauthMessage);
    return () => window.removeEventListener("message", handleOauthMessage);
  }, [queryClient]);

  const allConnections = connectionsQuery.data?.items ?? [];
  const connectedConnections = allConnections.filter((item) => item.status === "configured" || item.status === "connected");
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
    const nextSearchParams = new URLSearchParams(location.search);

    if (nextFilter === "all") {
      nextSearchParams.delete("module");
      setSearchParams(nextSearchParams, { replace: true });
      return;
    }

    nextSearchParams.set("module", nextFilter);
    setSearchParams(nextSearchParams, { replace: true });
  }

  function launchUrl(provider: IntegrationProvider) {
    if (provider.id === "zoho") {
      return buildApiUrl(`/integrations/${provider.id}/oauth/start?frontend_origin=${encodeURIComponent(window.location.origin)}`);
    }

    return provider.launch_url;
  }

  function handleConnect(provider: IntegrationProvider) {
    const popup = window.open(launchUrl(provider), `sysatlas-${provider.id}`, popupFeatures());
    if (!popup) {
      setNoticeColor("warning");
      setNotice(`Allow pop-ups to open the ${provider.name} connection window.`);
      return;
    }

    popup.focus();
    if (provider.id === "zoho") {
      setNoticeColor("info");
      setNotice("Complete the Zoho sign-in and consent flow in the popup. SysAtlas will save the encrypted credentials automatically.");
      return;
    }

    setNoticeColor("info");
    setNotice(`${provider.name} setup opened in a new window.`);
  }

  return (
    <div className="d-grid gap-4">
      <CAlert color="info" className="mb-0">
        Integrations open in provider-hosted browser sessions. They only show as connected after the live provider link is saved
        here.
      </CAlert>

      <div className="d-flex flex-wrap gap-2">
        {filterOptions.map((option) => (
          <CButton
            key={option.id}
            color={moduleFilter === option.id ? "primary" : "secondary"}
            variant={moduleFilter === option.id ? undefined : "outline"}
            onClick={() => handleFilterChange(option.id)}
          >
            {option.label}
          </CButton>
        ))}
      </div>

      {connectionsQuery.isLoading || catalogQuery.isLoading ? (
        <CCard className="shadow-sm">
          <CCardBody className="py-5 text-center text-body-secondary">
            <CSpinner color="primary" className="mb-3" />
            <div>Loading integration catalog...</div>
          </CCardBody>
        </CCard>
      ) : connectionsQuery.isError || catalogQuery.isError ? (
        <CAlert color="danger" className="mb-0">
          {connectionsQuery.error instanceof Error
            ? connectionsQuery.error.message
            : catalogQuery.error instanceof Error
              ? catalogQuery.error.message
              : "Unable to load integrations."}
        </CAlert>
      ) : (
        <CCard className="shadow-sm">
          <CCardHeader className="d-flex flex-wrap align-items-start justify-content-between gap-3">
            <div>
              <p className="mb-1 fw-semibold">Integration Providers</p>
              <div className="d-flex flex-wrap gap-2">
                <CBadge color="secondary">
                  {providerRows.length} shown
                  {moduleFilter === "all" ? "" : ` in ${humanizeKey(moduleFilter)}`}
                </CBadge>
                <CBadge color="success">{connectedConnections.length} connected</CBadge>
              </div>
            </div>

            <div style={{ maxWidth: "22rem", width: "100%" }}>
              <CInputGroup>
                <CInputGroupText>
                  <CIcon icon={cilSearch} />
                </CInputGroupText>
                <CFormInput
                  value={providerSearch}
                  onChange={(event) => setProviderSearch(event.target.value)}
                  placeholder="Search integrations"
                />
              </CInputGroup>
            </div>
          </CCardHeader>

          {providerRows.length === 0 ? (
            <CCardBody className="text-body-secondary">No integrations match the current filter.</CCardBody>
          ) : (
            <>
              {notice ? (
                <div className="px-4 pt-4">
                  <CAlert color={noticeColor} className="mb-0">
                    {notice}
                  </CAlert>
                </div>
              ) : null}

              <CCardBody className={notice ? "pt-3" : undefined}>
                <CTable hover responsive className="mb-0 align-middle">
                  <thead>
                    <tr>
                      <th>Integration</th>
                      <th className="d-none d-lg-table-cell">Category</th>
                      <th className="d-none d-xl-table-cell">Modules</th>
                      <th>Status</th>
                      <th className="d-none d-md-table-cell">Session Expires</th>
                      <th className="d-none d-lg-table-cell">Updated</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {providerRows.map(({ provider, connection }) => {
                      const providerIsConnected = isConnected(connection);

                      return (
                        <tr key={provider.id}>
                          <td>
                            <div className="d-flex align-items-start gap-3">
                              <IntegrationLogo providerId={provider.id} providerName={provider.name} size="sm" />
                              <div className="min-w-0">
                                <div className="fw-semibold">{provider.name}</div>
                                <div className="small text-body-secondary">{provider.description}</div>
                                <div className="small text-body-secondary d-lg-none mt-2">
                                  <div>{provider.category}</div>
                                  <div>{provider.supported_modules.map(humanizeKey).join(", ")}</div>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="d-none d-lg-table-cell">{provider.category}</td>
                          <td className="d-none d-xl-table-cell">{provider.supported_modules.map(humanizeKey).join(", ")}</td>
                          <td>
                            <StatusBadge
                              label={connection ? connectionLabel(connection.status) : "Not Connected"}
                              tone={connection ? connectionTone(connection.status) : "neutral"}
                            />
                          </td>
                          <td className="d-none d-md-table-cell">{sessionExpiresLabel(connection)}</td>
                          <td className="d-none d-lg-table-cell">{formatDateTime(connection?.updated_at ?? null)}</td>
                          <td className="text-end">
                            <CButton
                              size="sm"
                              color={providerIsConnected ? "secondary" : "primary"}
                              variant={providerIsConnected ? "outline" : undefined}
                              onClick={() => handleConnect(provider)}
                            >
                              Connect
                            </CButton>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </CTable>
              </CCardBody>
            </>
          )}
        </CCard>
      )}
    </div>
  );
}
