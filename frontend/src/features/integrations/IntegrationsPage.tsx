import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CFormInput,
  CFormLabel,
  CFormText,
  CInputGroup,
  CInputGroupText,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CSpinner,
  CTable,
} from "@coreui/react";
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

type ZohoOauthFormState = {
  redirect_uri: string;
  client_id: string;
  client_secret: string;
};

const ZOHO_API_CONSOLE_URL = "https://api-console.zoho.com/";

export function IntegrationsPage() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [providerSearch, setProviderSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeColor, setNoticeColor] = useState<"info" | "success" | "warning" | "danger">("info");
  const [zohoOauthModalVisible, setZohoOauthModalVisible] = useState(false);
  const [zohoOauthStep, setZohoOauthStep] = useState<1 | 2>(1);
  const [zohoOauthHint, setZohoOauthHint] = useState<string | null>(null);
  const [zohoOauthError, setZohoOauthError] = useState("");
  const [zohoOauthFormState, setZohoOauthFormState] = useState<ZohoOauthFormState>({
    redirect_uri: "",
    client_id: "",
    client_secret: "",
  });

  const moduleFilter = (searchParams.get("module") as ModuleFilter | null) ?? "all";

  const catalogQuery = useQuery({
    queryKey: ["integrations", "catalog"],
    queryFn: api.getIntegrationCatalog,
  });

  const connectionsQuery = useQuery({
    queryKey: ["integrations", "connections"],
    queryFn: api.getIntegrations,
  });

  const saveZohoOauthConfigMutation = useMutation({
    mutationFn: (payload: ZohoOauthFormState) => api.saveIntegrationOauthConfig("zoho", payload),
    onSuccess: (config) => {
      setZohoOauthHint(config.client_id_hint);
      setZohoOauthError("");
      setZohoOauthStep(1);
      setZohoOauthModalVisible(false);
      setNoticeColor("info");
      setNotice("Zoho One app credentials saved. Continue the Zoho One sign-in flow in the popup.");
      openProviderWindow("zoho", config.redirect_uri);
    },
    onError: (error) => {
      setZohoOauthError(error instanceof Error ? error.message : "Unable to save the Zoho One app credentials.");
    },
  });

  const importIntuneDevicesMutation = useMutation({
    mutationFn: () => api.importIntegrationDevices("intune"),
    onSuccess: (result) => {
      setNoticeColor("success");
      setNotice(result.message);
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: ["integrations"] }),
        queryClient.invalidateQueries({ queryKey: ["devices"] }),
      ]);
    },
    onError: (error) => {
      setNoticeColor("danger");
      setNotice(error instanceof Error ? error.message : "Unable to import Intune devices.");
    },
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

  function closeZohoOauthModal() {
    if (saveZohoOauthConfigMutation.isPending) {
      return;
    }

    setZohoOauthModalVisible(false);
    setZohoOauthStep(1);
    setZohoOauthError("");
    setZohoOauthFormState({
      redirect_uri: "",
      client_id: "",
      client_secret: "",
    });
  }

  function openProviderWindow(providerId: string, redirectUri?: string) {
    const provider =
      (catalogQuery.data?.providers ?? []).find((catalogProvider) => catalogProvider.id === providerId) ?? null;
    if (!provider) {
      setNoticeColor("danger");
      setNotice("The requested integration provider could not be found.");
      return;
    }

    const usesOAuthPopup = provider.id === "zoho" || provider.id === "intune";
    const popupUrl = usesOAuthPopup
      ? buildApiUrl(`/integrations/${provider.id}/oauth/start?frontend_origin=${encodeURIComponent(window.location.origin)}`)
      : provider.launch_url;
    const popup = window.open(popupUrl, `sysatlas-${provider.id}`, popupFeatures());
    if (!popup) {
      setNoticeColor("warning");
      setNotice(`Allow pop-ups to open the ${provider.name} connection window.`);
      return;
    }

    popup.focus();
    if (provider.id === "zoho") {
      setNoticeColor("info");
      setNotice(
        `Complete the Zoho One sign-in and consent flow in the popup. Redirect URL: ${redirectUri ?? zohoOauthFormState.redirect_uri}.`,
      );
      return;
    }

    if (provider.id === "intune") {
      setNoticeColor("info");
      setNotice("Complete the Microsoft sign-in and Intune consent flow in the popup. SysAtlas will import devices after approval.");
      return;
    }

    setNoticeColor("info");
    setNotice(`${provider.name} setup opened in a new window.`);
  }

  async function handleConnect(provider: IntegrationProvider) {
    if (provider.id !== "zoho") {
      openProviderWindow(provider.id);
      return;
    }

    setZohoOauthError("");

    try {
      const oauthConfig = await api.getIntegrationOauthConfig(provider.id);
      setZohoOauthHint(oauthConfig.client_id_hint);

      if (!oauthConfig.configured) {
        setZohoOauthStep(1);
        setZohoOauthFormState({
          redirect_uri: oauthConfig.redirect_uri,
          client_id: "",
          client_secret: "",
        });
        setZohoOauthModalVisible(true);
        return;
      }

      openProviderWindow(provider.id, oauthConfig.redirect_uri);
    } catch (error) {
      setNoticeColor("danger");
      setNotice(error instanceof Error ? error.message : "Unable to start the Zoho One connection.");
    }
  }

  function handleZohoOauthFieldChange<Key extends keyof ZohoOauthFormState>(key: Key, value: ZohoOauthFormState[Key]) {
    setZohoOauthFormState((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleZohoOauthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setZohoOauthError("");
    saveZohoOauthConfigMutation.mutate(zohoOauthFormState);
  }

  function handleImportDevices(providerId: string) {
    if (providerId !== "intune") {
      return;
    }
    importIntuneDevicesMutation.mutate();
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
                              onClick={() => void handleConnect(provider)}
                            >
                              Connect
                            </CButton>
                            {provider.id === "intune" && providerIsConnected ? (
                              <CButton
                                size="sm"
                                color="primary"
                                className="ms-2"
                                disabled={importIntuneDevicesMutation.isPending}
                                onClick={() => handleImportDevices(provider.id)}
                              >
                                {importIntuneDevicesMutation.isPending ? "Importing..." : "Import Devices"}
                              </CButton>
                            ) : null}
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

      <CModal alignment="center" size="lg" visible={zohoOauthModalVisible} onClose={closeZohoOauthModal}>
        <form onSubmit={handleZohoOauthSubmit}>
          <CModalHeader>
            <CModalTitle>Zoho One OAuth Setup</CModalTitle>
          </CModalHeader>
          <CModalBody className="d-grid gap-3">
            {zohoOauthError ? (
              <CAlert color="danger" className="mb-0">
                {zohoOauthError}
              </CAlert>
            ) : null}

            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 rounded border bg-body-tertiary p-3">
              <div>
                <div className="fw-semibold">Step {zohoOauthStep} of 2</div>
                <div className="small text-body-secondary">
                  {zohoOauthStep === 1
                    ? "Create the Zoho app first, then continue to the credential form."
                    : "Paste the new client credentials and start the Zoho One consent flow."}
                </div>
              </div>
              <CBadge color="primary">{zohoOauthStep === 1 ? "Create App" : "Save Credentials"}</CBadge>
            </div>

            {zohoOauthStep === 1 ? (
              <>
                <CAlert color="info" className="mb-0">
                  Go to <strong>api-console.zoho.com</strong>, click <strong>Server-based Applications</strong>, and use
                  the redirect URL below when Zoho asks for it.
                </CAlert>

                <div className="d-grid gap-3 rounded border p-3">
                  <div>
                    <div className="fw-semibold">Which Zoho option to click</div>
                    <div className="small text-body-secondary">
                      Choose <strong>Server-based Applications</strong>. Do not use Client-based, Mobile-based,
                      Non-browser, or Self Client for this SysAtlas connection.
                    </div>
                  </div>

                  <div>
                    <CFormLabel htmlFor="zoho-redirect-uri">Redirect URL</CFormLabel>
                    <CFormInput
                      id="zoho-redirect-uri"
                      type="url"
                      value={zohoOauthFormState.redirect_uri}
                      onChange={(event) => handleZohoOauthFieldChange("redirect_uri", event.target.value)}
                      placeholder="http://localhost:8000/api/v1/integrations/zoho/oauth/callback"
                      required
                    />
                    <CFormText>Enter this exact URL in Zoho when it asks for the authorized redirect URI.</CFormText>
                  </div>

                  <div className="d-flex flex-wrap gap-2">
                    <CButton
                      type="button"
                      color="secondary"
                      variant="outline"
                      onClick={() => window.open(ZOHO_API_CONSOLE_URL, "_blank", "noopener,noreferrer")}
                    >
                      Open api-console.zoho.com
                    </CButton>
                  </div>
                </div>
              </>
            ) : (
              <>
                <CAlert color="info" className="mb-0">
                  After Zoho creates the <strong>Server-based Application</strong>, paste the generated client ID and
                  client secret below, then click <strong>Save and Connect</strong>.
                </CAlert>

                <div className="rounded border bg-body-tertiary p-3">
                  <div className="fw-semibold">Redirect URL in use</div>
                  <div className="small text-body-secondary">{zohoOauthFormState.redirect_uri}</div>
                </div>

                <div>
                  <CFormLabel htmlFor="zoho-client-id">Client ID</CFormLabel>
                  <CFormInput
                    id="zoho-client-id"
                    value={zohoOauthFormState.client_id}
                    onChange={(event) => handleZohoOauthFieldChange("client_id", event.target.value)}
                    placeholder={zohoOauthHint ?? "1000.xxxxxxxxxxxxxxxxxxxxx"}
                    required
                  />
                </div>

                <div>
                  <CFormLabel htmlFor="zoho-client-secret">Client Secret</CFormLabel>
                  <CFormInput
                    id="zoho-client-secret"
                    type="password"
                    value={zohoOauthFormState.client_secret}
                    onChange={(event) => handleZohoOauthFieldChange("client_secret", event.target.value)}
                    placeholder="Paste the Zoho One client secret"
                    required
                  />
                </div>
              </>
            )}
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" variant="outline" onClick={closeZohoOauthModal}>
              Cancel
            </CButton>
            {zohoOauthStep === 1 ? (
              <CButton
                type="button"
                color="primary"
                disabled={!zohoOauthFormState.redirect_uri.trim()}
                onClick={() => setZohoOauthStep(2)}
              >
                Next
              </CButton>
            ) : (
              <>
                <CButton type="button" color="secondary" variant="outline" onClick={() => setZohoOauthStep(1)}>
                  Back
                </CButton>
                <CButton type="submit" color="primary" disabled={saveZohoOauthConfigMutation.isPending}>
                  {saveZohoOauthConfigMutation.isPending ? "Saving..." : "Save and Connect"}
                </CButton>
              </>
            )}
          </CModalFooter>
        </form>
      </CModal>
    </div>
  );
}
