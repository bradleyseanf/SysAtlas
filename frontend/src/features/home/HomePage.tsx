import type { ChartData, ChartOptions } from "chart.js";
import { useQuery } from "@tanstack/react-query";
import CIcon from "@coreui/icons-react";
import { cilDevices, cilPeople, cilShieldAlt } from "@coreui/icons";
import { CAlert, CBadge, CCard, CCardBody, CCardHeader, CCol, CProgress, CProgressBar, CRow, CSpinner, useColorModes } from "@coreui/react";
import { CChartBar, CChartDoughnut } from "@coreui/react-chartjs";

import { StatCard } from "../../components/StatCard";
import { api } from "../../lib/api";
import { hasPermission, moduleRoutePermissions, settingsRoutePermissions } from "../../lib/access";
import { useDevModeUrlState } from "../../lib/devMode";
import type { DeviceListItem } from "../../types/api";
import { getTestDevicesResponse, getTestUsersResponse } from "../../tests/inventoryFixtures";
import { useAuth } from "../auth/AuthContext";

type TimestampedItem = {
  created_at: string;
};

type DailyAdditionSeries = {
  labels: string[];
  values: number[];
};

function librarySourceCount(items: Array<{ children: Array<unknown> }>) {
  return items.reduce((count, item) => count + item.children.length, 0);
}

function formatChartDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function buildDailyAdditionSeries(items: TimestampedItem[]): DailyAdditionSeries {
  const counts = new Map<number, number>();

  for (const item of items) {
    const parsed = new Date(item.created_at);
    if (Number.isNaN(parsed.valueOf())) {
      continue;
    }

    const day = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
    const key = day.getTime();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  if (counts.size === 0) {
    return { labels: [], values: [] };
  }

  const sortedDays = [...counts.keys()].sort((left, right) => left - right);
  const labels: string[] = [];
  const values: number[] = [];
  const cursor = new Date(sortedDays[0]);
  const lastDay = sortedDays[sortedDays.length - 1];

  while (cursor.getTime() <= lastDay) {
    const day = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
    const key = day.getTime();
    labels.push(formatChartDate(day));
    values.push(counts.get(key) ?? 0);
    cursor.setDate(cursor.getDate() + 1);
  }

  return { labels, values };
}

function buildComplianceBreakdown(items: DeviceListItem[]) {
  const compliant = items.filter((item) => item.compliance_state === "compliant").length;
  const nonCompliant = items.length - compliant;
  const compliantShare = items.length === 0 ? 0 : Math.round((compliant / items.length) * 100);

  return {
    compliant,
    nonCompliant,
    compliantShare,
  };
}

function readCssVar(name: string, fallback: string) {
  if (typeof window === "undefined") {
    return fallback;
  }

  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function loadingState(message: string) {
  return (
    <div className="d-grid gap-3 text-center" style={{ minHeight: "18rem", placeItems: "center" }}>
      <CSpinner color="primary" />
      <p className="mb-0 text-body-secondary">{message}</p>
    </div>
  );
}

function emptyState(message: string) {
  return (
    <div className="d-grid text-center" style={{ minHeight: "18rem", placeItems: "center" }}>
      <p className="mb-0 text-body-secondary">{message}</p>
    </div>
  );
}

export function HomePage() {
  const { session } = useAuth();
  const { colorMode } = useColorModes("sysatlas-color-mode");
  const { isDevMode } = useDevModeUrlState();

  const canViewLibraries = session ? hasPermission(session.user, moduleRoutePermissions.libraries) : false;
  const canViewUsers = session ? hasPermission(session.user, moduleRoutePermissions.users) : false;
  const canViewDevices = session ? hasPermission(session.user, moduleRoutePermissions.devices) : false;
  const canManageProfiles = session ? hasPermission(session.user, settingsRoutePermissions.profiles) : false;
  const canManageAccessUsers = session ? hasPermission(session.user, settingsRoutePermissions.users) : false;
  const canManageIntegrations = session ? hasPermission(session.user, settingsRoutePermissions.integrations) : false;

  const librariesQuery = useQuery({
    queryKey: ["libraries"],
    queryFn: api.getLibraries,
    enabled: canViewLibraries,
  });

  const usersQuery = useQuery({
    queryKey: ["users", isDevMode ? "dev" : "live"],
    queryFn: () => (isDevMode ? Promise.resolve(getTestUsersResponse()) : api.getUsers()),
    enabled: canViewUsers,
  });

  const devicesQuery = useQuery({
    queryKey: ["devices", isDevMode ? "dev" : "live"],
    queryFn: () => (isDevMode ? Promise.resolve(getTestDevicesResponse()) : api.getDevices()),
    enabled: canViewDevices,
  });

  const accessControlQuery = useQuery({
    queryKey: ["settings", "access-control"],
    queryFn: api.getAccessControl,
    enabled: canManageProfiles || canManageAccessUsers || canManageIntegrations,
  });

  if (!session) {
    return null;
  }

  const chartThemeKey = colorMode ?? "auto";
  const primary = readCssVar("--cui-primary", "#c94a63");
  const primaryRgb = readCssVar("--cui-primary-rgb", "201, 74, 99");
  const warning = readCssVar("--cui-warning", "#f9b115");
  const warningRgb = readCssVar("--cui-warning-rgb", "249, 177, 21");
  const bodyColor = readCssVar("--cui-body-color", "#212631");
  const secondaryColor = readCssVar("--cui-secondary-color", "#6b7785");
  const borderColor = readCssVar("--cui-border-color", "#d8dbe0");

  const snapshotCards = [
    canViewLibraries
      ? {
          label: "Library Sources",
          value: librariesQuery.data ? librarySourceCount(librariesQuery.data.items) : "--",
          caption: "Connected library sources.",
        }
      : null,
    canViewUsers
      ? {
          label: "Users",
          value: usersQuery.data?.stats.total_users ?? "--",
          caption: "User records.",
        }
      : null,
    canViewDevices
      ? {
          label: "Devices",
          value: devicesQuery.data?.stats.total_devices ?? "--",
          caption: "Managed devices.",
        }
      : null,
    canManageAccessUsers
      ? {
          label: "Access Users",
          value: accessControlQuery.data?.users.length ?? "--",
          caption: "Workspace sign-in users.",
        }
      : null,
    canManageProfiles
      ? {
          label: "Profiles",
          value: accessControlQuery.data?.profiles.length ?? "--",
          caption: "Access profiles.",
        }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: string | number; caption: string }>;

  const userSeries = buildDailyAdditionSeries(usersQuery.data?.items ?? []);
  const deviceSeries = buildDailyAdditionSeries(devicesQuery.data?.items ?? []);
  const complianceBreakdown = buildComplianceBreakdown(devicesQuery.data?.items ?? []);

  const additionChartOptions: ChartOptions<"bar"> = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: secondaryColor,
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 7,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: secondaryColor,
          precision: 0,
        },
        grid: {
          color: `rgba(${primaryRgb}, 0.08)`,
        },
        border: {
          display: false,
        },
      },
    },
  };

  const complianceChartOptions: ChartOptions<"doughnut"> = {
    maintainAspectRatio: false,
    cutout: "72%",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: bodyColor,
          usePointStyle: true,
          padding: 18,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.label}: ${context.parsed} devices`,
        },
      },
    },
  };

  const userChartData: ChartData<"bar"> = {
    labels: userSeries.labels,
    datasets: [
      {
        label: "Users added",
        data: userSeries.values,
        backgroundColor: `rgba(${primaryRgb}, 0.72)`,
        borderColor: primary,
        borderRadius: 10,
        borderSkipped: false,
        maxBarThickness: 28,
      },
    ],
  };

  const deviceChartData: ChartData<"bar"> = {
    labels: deviceSeries.labels,
    datasets: [
      {
        label: "Devices added",
        data: deviceSeries.values,
        backgroundColor: `rgba(${warningRgb}, 0.72)`,
        borderColor: warning,
        borderRadius: 10,
        borderSkipped: false,
        maxBarThickness: 28,
      },
    ],
  };

  const complianceChartData: ChartData<"doughnut"> = {
    labels: ["Compliant", "Non-Compliant"],
    datasets: [
      {
        data: [complianceBreakdown.compliant, complianceBreakdown.nonCompliant],
        backgroundColor: [primary, warning],
        hoverBackgroundColor: [primary, warning],
        borderColor,
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="d-grid gap-4">
      <CCard className="shadow-sm">
        <CCardBody className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <h2 className="h4 mb-0">Dashboard</h2>
          <div className="d-flex flex-wrap gap-2">
            {isDevMode ? <CBadge color="warning">Test data</CBadge> : null}
            {canViewUsers ? <CBadge color="secondary">{usersQuery.data?.stats.total_users ?? "--"} users</CBadge> : null}
            {canViewDevices ? <CBadge color="secondary">{devicesQuery.data?.stats.total_devices ?? "--"} devices</CBadge> : null}
            {canViewDevices ? <CBadge color="secondary">{complianceBreakdown.compliantShare}% compliant</CBadge> : null}
          </div>
        </CCardBody>
      </CCard>

      <CRow className="g-4" xs={{ cols: 1 }} md={{ cols: 2 }} xl={{ cols: 4 }}>
        {snapshotCards.map((card) => (
          <CCol key={card.label}>
            <StatCard label={card.label} value={card.value} caption={card.caption} />
          </CCol>
        ))}
      </CRow>

      {canViewUsers || canViewDevices ? (
        <>
          <CRow className="g-4" xl={{ cols: 2 }}>
            {canViewUsers ? (
              <CCol>
                <CCard className="h-100 shadow-sm">
                  <CCardHeader className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                    <div className="d-flex align-items-center gap-2">
                      <CIcon icon={cilPeople} />
                      <span className="fw-semibold">Users Added by Date</span>
                    </div>
                    {usersQuery.data ? <CBadge color="secondary">{usersQuery.data.items.length} records</CBadge> : null}
                  </CCardHeader>
                  <CCardBody>
                  {usersQuery.isLoading ? (
                    loadingState("Loading user activity...")
                  ) : usersQuery.isError ? (
                    <CAlert color="danger" className="mb-0">
                      {usersQuery.error instanceof Error ? usersQuery.error.message : "Unable to load user activity."}
                    </CAlert>
                  ) : usersQuery.data && userSeries.labels.length > 0 ? (
                    <div style={{ height: "20rem" }}>
                      <CChartBar
                        key={`users-${chartThemeKey}`}
                        data={userChartData}
                        height={320}
                        options={additionChartOptions}
                        fallbackContent="Users added by date"
                        wrapper={false}
                      />
                    </div>
                  ) : (
                    emptyState("No user records are available to chart yet.")
                  )}
                  </CCardBody>
                </CCard>
              </CCol>
            ) : null}

            {canViewDevices ? (
              <CCol>
                <CCard className="h-100 shadow-sm">
                  <CCardHeader className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                    <div className="d-flex align-items-center gap-2">
                      <CIcon icon={cilDevices} />
                      <span className="fw-semibold">Devices Added by Date</span>
                    </div>
                    {devicesQuery.data ? <CBadge color="secondary">{devicesQuery.data.items.length} records</CBadge> : null}
                  </CCardHeader>
                  <CCardBody>
                  {devicesQuery.isLoading ? (
                    loadingState("Loading device activity...")
                  ) : devicesQuery.isError ? (
                    <CAlert color="danger" className="mb-0">
                      {devicesQuery.error instanceof Error ? devicesQuery.error.message : "Unable to load device activity."}
                    </CAlert>
                  ) : devicesQuery.data && deviceSeries.labels.length > 0 ? (
                    <div style={{ height: "20rem" }}>
                      <CChartBar
                        key={`devices-${chartThemeKey}`}
                        data={deviceChartData}
                        height={320}
                        options={additionChartOptions}
                        fallbackContent="Devices added by date"
                        wrapper={false}
                      />
                    </div>
                  ) : (
                    emptyState("No device records are available to chart yet.")
                  )}
                  </CCardBody>
                </CCard>
              </CCol>
            ) : null}
          </CRow>

          {canViewDevices ? (
            <CCard className="shadow-sm">
              <CCardHeader className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                <div className="d-flex align-items-center gap-2">
                  <CIcon icon={cilShieldAlt} />
                  <span className="fw-semibold">Device Compliance</span>
                </div>
                {devicesQuery.data ? <CBadge color="secondary">{complianceBreakdown.compliantShare}% compliant</CBadge> : null}
              </CCardHeader>
              <CCardBody>
              {devicesQuery.isLoading ? (
                loadingState("Loading compliance posture...")
              ) : devicesQuery.isError ? (
                <CAlert color="danger" className="mb-0">
                  {devicesQuery.error instanceof Error ? devicesQuery.error.message : "Unable to load compliance posture."}
                </CAlert>
              ) : devicesQuery.data && devicesQuery.data.items.length > 0 ? (
                <CRow className="g-4 align-items-center">
                  <CCol lg={5}>
                    <div style={{ height: "18rem" }}>
                      <CChartDoughnut
                        key={`compliance-${chartThemeKey}`}
                        data={complianceChartData}
                        height={288}
                        options={complianceChartOptions}
                        fallbackContent="Compliant versus non-compliant devices"
                        wrapper={false}
                      />
                    </div>
                  </CCol>
                  <CCol lg={7}>
                    <div className="d-grid gap-4">
                      <CRow className="g-3" xs={{ cols: 1 }} md={{ cols: 3 }}>
                        <CCol>
                          <CCard className="h-100 bg-body-tertiary shadow-none">
                            <CCardBody>
                              <div className="small text-body-secondary text-uppercase">Compliant</div>
                              <div className="fs-4 fw-semibold">{complianceBreakdown.compliant}</div>
                            </CCardBody>
                          </CCard>
                        </CCol>
                        <CCol>
                          <CCard className="h-100 bg-body-tertiary shadow-none">
                            <CCardBody>
                              <div className="small text-body-secondary text-uppercase">Non-Compliant</div>
                              <div className="fs-4 fw-semibold">{complianceBreakdown.nonCompliant}</div>
                            </CCardBody>
                          </CCard>
                        </CCol>
                        <CCol>
                          <CCard className="h-100 bg-body-tertiary shadow-none">
                            <CCardBody>
                              <div className="small text-body-secondary text-uppercase">Total Devices</div>
                              <div className="fs-4 fw-semibold">{devicesQuery.data.stats.total_devices}</div>
                            </CCardBody>
                          </CCard>
                        </CCol>
                      </CRow>

                      <div>
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span className="fw-semibold">Compliance</span>
                          <span className="text-body-secondary">{complianceBreakdown.compliantShare}%</span>
                        </div>
                        <CProgress thin>
                          <CProgressBar color="primary" value={complianceBreakdown.compliantShare} />
                        </CProgress>
                      </div>
                    </div>
                  </CCol>
                </CRow>
              ) : (
                emptyState("No device records are available to chart yet.")
              )}
              </CCardBody>
            </CCard>
          ) : null}
        </>
      ) : (
        <CCard className="shadow-sm">
          <CCardBody className="py-5 text-center text-body-secondary">
            Charts appear here when you have access to Users or Devices.
          </CCardBody>
        </CCard>
      )}
    </div>
  );
}
