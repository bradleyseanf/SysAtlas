import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import CIcon from "@coreui/icons-react";
import {
  cibGithub,
  cilAccountLogout,
  cilApplicationsSettings,
  cilContrast,
  cilDevices,
  cilLibrary,
  cilMenu,
  cilMoon,
  cilPeople,
  cilSettings,
  cilSpeedometer,
  cilSun,
} from "@coreui/icons";
import {
  CBadge,
  CCloseButton,
  CContainer,
  CLink,
  CDropdown,
  CDropdownDivider,
  CDropdownHeader,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
  CFormSwitch,
  CHeader,
  CHeaderNav,
  CHeaderToggler,
  CNavItem,
  CNavLink,
  CNavTitle,
  CSidebar,
  CSidebarFooter,
  CSidebarHeader,
  CSidebarNav,
  CSidebarToggler,
  useColorModes,
} from "@coreui/react";

import { APP_NAME, APP_REPOSITORY_URL, APP_VERSION } from "../../lib/appMeta";
import {
  accessibleSettingsNavigation,
  hasPermission,
  moduleRoutePermissions,
  pageTitleForPath,
} from "../../lib/access";
import { useDevModeUrlState } from "../../lib/devMode";
import { initialsForUser } from "../../lib/formatters";
import { useAuth } from "../auth/AuthContext";

type NavigationItem = {
  to: string;
  label: string;
  icon: string[];
  end?: boolean;
  permission?: string;
};

const baseNavigationItems: NavigationItem[] = [
  { to: "/home", label: "Home", icon: cilSpeedometer, end: true },
  { to: "/libraries", label: "Libraries", icon: cilLibrary, permission: moduleRoutePermissions.libraries, end: true },
  { to: "/users", label: "Users", icon: cilPeople, permission: moduleRoutePermissions.users, end: true },
  { to: "/devices", label: "Devices", icon: cilDevices, permission: moduleRoutePermissions.devices, end: true },
];

function colorModeIcon(mode: string) {
  if (mode === "dark") {
    return cilMoon;
  }

  if (mode === "light") {
    return cilSun;
  }

  return cilContrast;
}

export function AppShell() {
  const location = useLocation();
  const { session, signOut } = useAuth();
  const { isDevMode, isForcedDevMode, setDevMode, withDevMode } = useDevModeUrlState();
  const { colorMode, setColorMode } = useColorModes("sysatlas-color-mode");
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isSidebarNarrow, setIsSidebarNarrow] = useState(false);
  const headerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      headerRef.current?.classList.toggle("shadow-sm", document.documentElement.scrollTop > 0);
    };

    document.addEventListener("scroll", handleScroll);

    return () => {
      document.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const navigationItems = useMemo(() => {
    if (!session) {
      return [];
    }

    return baseNavigationItems.filter((item) => !item.permission || hasPermission(session.user, item.permission));
  }, [session]);

  if (!session) {
    return null;
  }

  const settingsNavigationItems = accessibleSettingsNavigation(session.user);
  const canManageSettings = settingsNavigationItems.length > 0;
  const currentTitle = pageTitleForPath(location.pathname);
  const fallbackName = `${session.user.first_name ?? ""} ${session.user.last_name ?? ""}`.trim();
  const displayName = (session.user.display_name ?? fallbackName) || session.user.email;
  const userRoleLabel = session.user.is_superuser ? "Super Admin" : session.user.profile?.name ?? "Operator";

  return (
    <div>
      <CSidebar
        className="border-end"
        colorScheme="dark"
        position="fixed"
        unfoldable={isSidebarNarrow}
        visible={isSidebarVisible}
        onVisibleChange={setIsSidebarVisible}
      >
        <CSidebarHeader className="border-bottom justify-content-between gap-2">
          <div className="px-3 py-2">
            <div className="fs-5 fw-semibold text-white">{APP_NAME}</div>
            <div className="small text-white-50">Dashboard</div>
          </div>
          <CCloseButton
            className="d-lg-none me-2"
            dark
            onClick={() => setIsSidebarVisible(false)}
          />
        </CSidebarHeader>

        <CSidebarNav>
          <CNavTitle>Workspace</CNavTitle>
          {navigationItems.map((item) => (
            <CNavItem key={item.to}>
              <CNavLink as={NavLink} to={withDevMode(item.to)} end={item.end}>
                <CIcon customClassName="nav-icon" icon={item.icon} />
                {item.label}
              </CNavLink>
            </CNavItem>
          ))}
        </CSidebarNav>

        <CSidebarFooter className="border-top d-none d-lg-flex align-items-center justify-content-between gap-2 px-3 py-2">
          <div className="d-flex align-items-center gap-2 overflow-hidden">
            <span className="small text-white-50 d-narrow-none">{APP_VERSION}</span>
            <CLink
              aria-label={`${APP_NAME} GitHub repository`}
              className="d-inline-flex align-items-center justify-content-center rounded p-1 text-white-50 text-decoration-none"
              href={APP_REPOSITORY_URL}
              rel="noreferrer"
              target="_blank"
              title={`${APP_NAME} GitHub repository`}
            >
              <CIcon icon={cibGithub} size="lg" />
            </CLink>
          </div>
          <CSidebarToggler onClick={() => setIsSidebarNarrow((current) => !current)} />
        </CSidebarFooter>
      </CSidebar>

      <div className="wrapper d-flex min-vh-100 flex-column">
        <CHeader position="sticky" className="mb-4 p-0" ref={headerRef}>
          <CContainer fluid className="border-bottom px-4">
            <CHeaderToggler
              onClick={() => setIsSidebarVisible((current) => !current)}
              style={{ marginInlineStart: "-14px" }}
            >
              <CIcon icon={cilMenu} size="lg" />
            </CHeaderToggler>

            <CHeaderNav className="ms-auto align-items-center">
              {canManageSettings ? (
                <li className="nav-item d-none d-lg-flex align-items-center gap-2 me-3">
                  <span className="small text-body-secondary">{isForcedDevMode ? "Static demo" : "Test mode"}</span>
                  <CFormSwitch
                    id="dev-mode-switch"
                    checked={isDevMode}
                    disabled={isForcedDevMode}
                    onChange={(event) => setDevMode(event.target.checked)}
                  />
                </li>
              ) : null}

              <li className="nav-item py-1">
                <div className="vr h-100 mx-2 text-body text-opacity-75"></div>
              </li>

              <CDropdown variant="nav-item" placement="bottom-end">
                <CDropdownToggle caret={false}>
                  <CIcon icon={colorModeIcon(colorMode ?? "auto")} size="lg" />
                </CDropdownToggle>
                <CDropdownMenu>
                  <CDropdownItem active={colorMode === "light"} as="button" type="button" onClick={() => setColorMode("light")}>
                    <CIcon className="me-2" icon={cilSun} /> Light
                  </CDropdownItem>
                  <CDropdownItem active={colorMode === "dark"} as="button" type="button" onClick={() => setColorMode("dark")}>
                    <CIcon className="me-2" icon={cilMoon} /> Dark
                  </CDropdownItem>
                  <CDropdownItem active={colorMode === "auto"} as="button" type="button" onClick={() => setColorMode("auto")}>
                    <CIcon className="me-2" icon={cilContrast} /> Auto
                  </CDropdownItem>
                </CDropdownMenu>
              </CDropdown>

              <li className="nav-item py-1">
                <div className="vr h-100 mx-2 text-body text-opacity-75"></div>
              </li>

              <CDropdown variant="nav-item" placement="bottom-end">
                <CDropdownToggle caret={false} className="d-flex align-items-center gap-2 py-0 text-decoration-none">
                  <span className="avatar avatar-md bg-primary text-white fw-semibold">
                    {initialsForUser(displayName, session.user.email)}
                  </span>
                  <span className="d-none d-md-flex flex-column align-items-start">
                    <span className="fw-semibold text-body-emphasis">{displayName}</span>
                    <span className="small text-body-secondary">{userRoleLabel}</span>
                  </span>
                </CDropdownToggle>
                <CDropdownMenu className="pt-0" style={{ minWidth: "18rem" }}>
                  <CDropdownHeader className="bg-body-tertiary fw-semibold">Signed in as</CDropdownHeader>
                  <div className="px-3 py-3">
                    <div className="fw-semibold text-body-emphasis">{displayName}</div>
                    <div className="small text-body-secondary">{session.user.email}</div>
                    <div className="d-flex flex-wrap gap-2 mt-3">
                      <CBadge color="primary">{userRoleLabel}</CBadge>
                      <CBadge color={session.user.is_active ? "success" : "danger"}>
                        {session.user.is_active ? "Active" : "Disabled"}
                      </CBadge>
                      {isForcedDevMode ? <CBadge color="warning">Static Demo</CBadge> : isDevMode ? <CBadge color="warning">Test Mode</CBadge> : null}
                    </div>
                  </div>
                  {canManageSettings ? (
                    <CDropdownItem as={NavLink} to={withDevMode("/settings")}>
                      <CIcon className="me-2" icon={cilSettings} />
                      Open settings
                    </CDropdownItem>
                  ) : null}
                  {canManageSettings ? (
                    <CDropdownItem as="button" type="button" onClick={() => setDevMode(!isDevMode)} className="d-lg-none" disabled={isForcedDevMode}>
                      <CIcon className="me-2" icon={cilApplicationsSettings} />
                      {isForcedDevMode ? "Static demo enabled" : `${isDevMode ? "Disable" : "Enable"} test mode`}
                    </CDropdownItem>
                  ) : null}
                  <CDropdownDivider />
                  <CDropdownItem
                    as="button"
                    type="button"
                    onClick={() => {
                      void signOut();
                    }}
                  >
                    <CIcon className="me-2" icon={cilAccountLogout} />
                    Sign out
                  </CDropdownItem>
                </CDropdownMenu>
              </CDropdown>
            </CHeaderNav>
          </CContainer>

          <CContainer fluid className="px-4 py-3">
            <h1 className="fs-4 fw-semibold mb-0">{currentTitle}</h1>
          </CContainer>
        </CHeader>

        <div className="body flex-grow-1">
          <CContainer fluid className="px-4 pb-4">
            <Outlet />
          </CContainer>
        </div>
      </div>
    </div>
  );
}
