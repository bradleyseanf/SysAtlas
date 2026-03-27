import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Computer, FolderTree, Github, House, LogOut, Settings, Users } from "lucide-react";

import { APP_NAME, APP_REPOSITORY_URL, APP_VERSION } from "../../lib/appMeta";
import {
  accessibleSettingsNavigation,
  hasPermission,
  moduleRoutePermissions,
  pageTitleForPath,
} from "../../lib/access";
import { initialsForUser } from "../../lib/formatters";
import { useAuth } from "../auth/AuthContext";

type NavigationItem = {
  to: string;
  label: string;
  icon: typeof House;
  end?: boolean;
  permission?: string;
};

const baseNavigationItems: NavigationItem[] = [
  { to: "/home", label: "Home", icon: House, end: true },
  { to: "/libraries", label: "Libraries", icon: FolderTree, permission: moduleRoutePermissions.libraries, end: true },
  { to: "/users", label: "Users", icon: Users, permission: moduleRoutePermissions.users, end: true },
  { to: "/devices", label: "Devices", icon: Computer, permission: moduleRoutePermissions.devices, end: true },
];

export function AppShell() {
  const location = useLocation();
  const { session, signOut } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    setIsProfileOpen(false);
  }, [location.pathname]);

  const navigationItems = useMemo(() => {
    if (!session) {
      return [];
    }

    return baseNavigationItems.filter((item) => !item.permission || hasPermission(session.user, item.permission));
  }, [session]);

  if (!session) {
    return null;
  }

  const canManageSettings = accessibleSettingsNavigation(session.user).length > 0;
  const currentTitle = pageTitleForPath(location.pathname);
  const fallbackName = `${session.user.first_name ?? ""} ${session.user.last_name ?? ""}`.trim();
  const displayName = (session.user.display_name ?? fallbackName) || session.user.email;

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 grid-sheen opacity-[0.02]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,74,99,0.035),transparent_28%),linear-gradient(180deg,#fbf7f2_0%,#f7f3ed_100%)]" />
      <div className="relative min-h-screen lg:pl-[268px]">
        <aside className="flex min-h-screen flex-col border-r border-white/8 bg-[rgba(17,22,29,0.98)] px-6 py-7 text-white shadow-[8px_0_28px_rgba(12,16,21,0.12)] backdrop-blur-[18px] lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:h-screen lg:w-[268px] lg:overflow-y-auto">
          <div>
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-white/42">Flight Deck</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">{APP_NAME}</h1>
            </div>

            <nav className="mt-10 space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                        isActive
                          ? "border border-[rgba(201,74,99,0.24)] bg-[rgba(201,74,99,0.16)] text-white shadow-[0_10px_20px_rgba(201,74,99,0.12)]"
                          : "border border-transparent text-white/72 hover:bg-white/6 hover:text-white"
                      }`
                    }
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto border-t border-white/8 pt-5">
            <div className="flex items-center justify-between rounded-[20px] border border-white/8 bg-white/[0.04] px-3 py-2.5 shadow-[0_12px_24px_rgba(6,9,14,0.18)]">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-white/54">{APP_VERSION}</span>
              <a
                href={APP_REPOSITORY_URL}
                target="_blank"
                rel="noreferrer"
                aria-label="Open SysAtlas GitHub repository"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(201,74,99,0.24)] bg-[rgba(201,74,99,0.16)] text-white shadow-[0_10px_18px_rgba(201,74,99,0.16)] transition hover:border-[rgba(201,74,99,0.36)] hover:bg-[rgba(201,74,99,0.24)]"
              >
                <Github className="h-4 w-4" />
              </a>
            </div>
          </div>
        </aside>

        <div className="relative flex min-h-screen flex-col">
          <header className="sticky top-0 z-20 border-b border-[rgba(23,32,42,0.08)] bg-[rgba(252,249,244,0.9)] px-6 py-4 backdrop-blur-xl lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.04em] text-atlas">{currentTitle}</h2>
              </div>

              <div className="relative flex items-center gap-3">
                {canManageSettings ? (
                  <NavLink
                    to="/settings"
                    aria-label="Open settings"
                    className={({ isActive }) =>
                      `inline-flex h-12 w-12 items-center justify-center rounded-2xl border transition ${
                        isActive
                          ? "border-[rgba(201,74,99,0.24)] bg-[rgba(201,74,99,0.1)] text-[var(--atlas-accent)] shadow-[0_14px_24px_rgba(201,74,99,0.1)]"
                          : "atlas-secondary-button text-atlas-soft"
                      }`
                    }
                  >
                    <Settings className="h-5 w-5" />
                  </NavLink>
                ) : null}

                <button
                  type="button"
                  onClick={() => setIsProfileOpen((current) => !current)}
                  className="atlas-secondary-button inline-flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--atlas-accent)] text-sm font-semibold text-white">
                    {initialsForUser(displayName, session.user.email)}
                  </span>
                  <span className="text-left">
                    <span className="block text-sm font-semibold">{displayName}</span>
                    <span className="text-atlas-muted block text-xs">
                      {session.user.is_superuser ? "Super Admin" : session.user.profile?.name ?? "Operator"}
                    </span>
                  </span>
                </button>

                {isProfileOpen ? (
                  <div className="atlas-panel-strong absolute right-0 top-[calc(100%+10px)] w-[320px] rounded-[28px] p-5">
                    <p className="text-lg font-semibold text-atlas">{displayName}</p>
                    <p className="mt-1 text-sm text-atlas-muted">{session.user.email}</p>
                    <div className="atlas-note mt-4 grid gap-3 rounded-2xl p-4">
                      <div>
                        <p className="text-atlas-accent-soft text-[0.72rem] font-semibold uppercase tracking-[0.18em]">Role</p>
                        <p className="mt-1 text-sm font-medium text-atlas">
                          {session.user.is_superuser ? "Super Admin" : session.user.profile?.name ?? "Operator"}
                        </p>
                      </div>
                      <div>
                        <p className="text-atlas-accent-soft text-[0.72rem] font-semibold uppercase tracking-[0.18em]">Status</p>
                        <p className="mt-1 text-sm font-medium text-atlas">{session.user.is_active ? "Active" : "Disabled"}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        void signOut();
                      }}
                      className="atlas-danger-button mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          <main className="flex-1 px-6 py-6 lg:px-8 lg:py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
