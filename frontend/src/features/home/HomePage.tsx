import type { ReactNode } from "react";
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

function DashboardPanel({
  title,
  subtitle,
  icon,
  badge,
  children,
}: {
  title: string;
  subtitle: string;
  icon: string[];
  badge?: string;
  children: ReactNode;
}) {
  return (
    <CCard className="h-100 shadow-sm home-panel-card">
      <CCardHeader className="border-0 bg-transparent px-4 pt-4 pb-0">
        <div className="d-flex flex-wrap align-items-start justify-content-between gap-3">
          <div className="d-flex align-items-start gap-3">
            <span className="home-panel-icon">
              <CIcon icon={icon} size="lg" />
            </span>
            <div>
              <p className="mb-1 fw-semibold">{title}</p>
              <p className="mb-0 text-body-secondary">{subtitle}</p>
            </div>
          </div>
          {badge ? <CBadge color="secondary">{badge}</CBadge> : null}
        </div>
      </CCardHeader>
      <CCardBody className="px-4 pb-4">{children}</CCardBody>
    </CCard>
  );
}

function loadingState(message: string) {
  return (
    <div className="home-panel-state">
      <CSpinner color="primary" />
      <p className="mb-0 text-body-secondary">{message}</p>
    </div>
  );
}

function emptyState(message: string) {
  return (
    <div className="home-panel-state">
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
          caption: "Connected SharePoint and Teams sources visible to this workspace.",
        }
      : null,
    canViewUsers
      ? {
          label: "Users",
          value: usersQuery.data?.stats.total_users ?? "--",
          caption: "Organization user records currently available in SysAtlas.",
        }
      : null,
    canViewDevices
      ? {
          label: "Devices",
          value: devicesQuery.data?.stats.total_devices ?? "--",
          caption: "Managed device records currently available in SysAtlas.",
        }
      : null,
    canManageAccessUsers
      ? {
          label: "Access Users",
          value: accessControlQuery.data?.users.length ?? "--",
          caption: "People who can sign in to this SysAtlas workspace.",
        }
      : null,
    canManageProfiles
      ? {
          label: "Profiles",
          value: accessControlQuery.data?.profiles.length ?? "--",
          caption: "Reusable access profiles for roles and permissions.",
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
      <CCard className="border-0 shadow-sm home-overview-card">
        <CCardBody className="p-4 p-lg-4">
          <CRow className="g-4 align-items-center">
            <CCol lg={8}>
              <p className="mb-2 home-overview-kicker">Overview</p>
              <h2 className="h3 mb-2">Dashboard</h2>
              <p className="mb-0 text-body-secondary">
                Use the left sidebar to open modules. This page shows user growth, device growth, and device compliance.
              </p>
            </CCol>
            <CCol lg={4}>
              <div className="d-flex flex-wrap justify-content-lg-end gap-2">
                <CBadge color={isDevMode ? "warning" : "success"}>{isDevMode ? "Test data" : "Live data"}</CBadge>
                {canViewUsers ? <CBadge color="secondary">{usersQuery.data?.stats.total_users ?? "--"} users</CBadge> : null}
                {canViewDevices ? <CBadge color="secondary">{devicesQuery.data?.stats.total_devices ?? "--"} devices</CBadge> : null}
                {canViewDevices ? <CBadge color="secondary">{complianceBreakdown.compliantShare}% compliant</CBadge> : null}
              </div>
            </CCol>
          </CRow>
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
                <DashboardPanel
                  title="Users Added by Date"
                  subtitle="User records added per day."
                  icon={cilPeople}
                  badge={usersQuery.data ? `${usersQuery.data.items.length} records` : undefined}
                >
                  {usersQuery.isLoading ? (
                    loadingState("Loading user activity...")
                  ) : usersQuery.isError ? (
                    <CAlert color="danger" className="mb-0">
                      {usersQuery.error instanceof Error ? usersQuery.error.message : "Unable to load user activity."}
                    </CAlert>
                  ) : usersQuery.data && userSeries.labels.length > 0 ? (
                    <div className="home-chart-shell">
                      <CChartBar
                        key={`users-${chartThemeKey}`}
                        data={userChartData}
                        options={additionChartOptions}
                        fallbackContent="Users added by date"
                      />
                    </div>
                  ) : (
                    emptyState("No user records are available to chart yet.")
                  )}
                </DashboardPanel>
              </CCol>
            ) : null}

            {canViewDevices ? (
              <CCol>
                <DashboardPanel
                  title="Devices Added by Date"
                  subtitle="Device records added per day."
                  icon={cilDevices}
                  badge={devicesQuery.data ? `${devicesQuery.data.items.length} records` : undefined}
                >
                  {devicesQuery.isLoading ? (
                    loadingState("Loading device activity...")
                  ) : devicesQuery.isError ? (
                    <CAlert color="danger" className="mb-0">
                      {devicesQuery.error instanceof Error ? devicesQuery.error.message : "Unable to load device activity."}
                    </CAlert>
                  ) : devicesQuery.data && deviceSeries.labels.length > 0 ? (
                    <div className="home-chart-shell">
                      <CChartBar
                        key={`devices-${chartThemeKey}`}
                        data={deviceChartData}
                        options={additionChartOptions}
                        fallbackContent="Devices added by date"
                      />
                    </div>
                  ) : (
                    emptyState("No device records are available to chart yet.")
                  )}
                </DashboardPanel>
              </CCol>
            ) : null}
          </CRow>

          {canViewDevices ? (
            <DashboardPanel
              title="Device Compliance"
              subtitle="Compliant vs non-compliant devices."
              icon={cilShieldAlt}
              badge={devicesQuery.data ? `${complianceBreakdown.compliantShare}% compliant` : undefined}
            >
              {devicesQuery.isLoading ? (
                loadingState("Loading compliance posture...")
              ) : devicesQuery.isError ? (
                <CAlert color="danger" className="mb-0">
                  {devicesQuery.error instanceof Error ? devicesQuery.error.message : "Unable to load compliance posture."}
                </CAlert>
              ) : devicesQuery.data && devicesQuery.data.items.length > 0 ? (
                <CRow className="g-4 align-items-center">
                  <CCol lg={5}>
                    <div className="home-chart-shell home-chart-shell-compact">
                      <CChartDoughnut
                        key={`compliance-${chartThemeKey}`}
                        data={complianceChartData}
                        options={complianceChartOptions}
                        fallbackContent="Compliant versus non-compliant devices"
                      />
                    </div>
                  </CCol>
                  <CCol lg={7}>
                    <div className="d-grid gap-3">
                      <div className="d-flex flex-wrap gap-3">
                        <div className="home-metric-chip">
                          <span className="small text-body-secondary text-uppercase">Compliant</span>
                          <strong className="fs-4">{complianceBreakdown.compliant}</strong>
                        </div>
                        <div className="home-metric-chip">
                          <span className="small text-body-secondary text-uppercase">Non-Compliant</span>
                          <strong className="fs-4">{complianceBreakdown.nonCompliant}</strong>
                        </div>
                        <div className="home-metric-chip">
                          <span className="small text-body-secondary text-uppercase">Total Devices</span>
                          <strong className="fs-4">{devicesQuery.data.stats.total_devices}</strong>
                        </div>
                      </div>

                      <div>
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <span className="fw-semibold">Compliance coverage</span>
                          <span className="text-body-secondary">{complianceBreakdown.compliantShare}%</span>
                        </div>
                        <CProgress thin className="home-compliance-progress">
                          <CProgressBar color="primary" value={complianceBreakdown.compliantShare} />
                        </CProgress>
                      </div>
                    </div>
                  </CCol>
                </CRow>
              ) : (
                emptyState("No device records are available to chart yet.")
              )}
            </DashboardPanel>
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
