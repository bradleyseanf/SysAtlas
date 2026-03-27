import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Computer, FolderCog, LogOut, Settings, Users } from "lucide-react";

import { initialsForUser } from "../../lib/formatters";
import { useAuth } from "../auth/AuthContext";

const navigationItems = [
  { to: "/users", label: "Users", icon: Users },
  { to: "/devices", label: "Devices", icon: Computer },
  { to: "/integrations", label: "Integrations", icon: FolderCog },
];

const routeTitles: Record<string, string> = {
  "/users": "Users",
  "/devices": "Devices",
  "/integrations": "Integrations",
};

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, signOut } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    setIsSettingsOpen(false);
    setIsProfileOpen(false);
  }, [location.pathname]);

  if (!session) {
    return null;
  }

  const currentTitle = routeTitles[location.pathname] ?? "Workspace";
  const fallbackName = `${session.user.first_name ?? ""} ${session.user.last_name ?? ""}`.trim();
  const displayName = (session.user.display_name ?? fallbackName) || session.user.email;

  function handleOpenIntegrations() {
    setIsSettingsOpen(false);
    void navigate("/integrations");
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 grid-sheen opacity-[0.04]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,74,99,0.06),transparent_24%),linear-gradient(180deg,#fbf7f2_0%,#f7f3ed_100%)]" />
      <div className="relative grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-white/8 bg-[rgba(17,22,29,0.98)] px-6 py-7 text-white backdrop-blur-[18px]">
          <nav className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? "border border-[rgba(201,74,99,0.3)] bg-[rgba(201,74,99,0.18)] text-white shadow-[0_12px_24px_rgba(201,74,99,0.16)]"
                        : "text-white/72 hover:bg-white/6 hover:text-white"
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </aside>

        <div className="relative flex min-h-screen flex-col">
          <header className="sticky top-0 z-20 border-b border-[rgba(23,32,42,0.08)] bg-[rgba(251,247,242,0.88)] px-6 py-4 backdrop-blur-xl lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-atlas-accent text-[0.74rem] font-semibold uppercase tracking-[0.22em]">Workspace</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-atlas">{currentTitle}</h2>
              </div>

              <div className="relative flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsSettingsOpen((current) => !current);
                    setIsProfileOpen(false);
                  }}
                  className="atlas-secondary-button inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen((current) => !current);
                    setIsSettingsOpen(false);
                  }}
                  className="atlas-secondary-button inline-flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--atlas-accent)] text-sm font-semibold text-white">
                    {initialsForUser(displayName, session.user.email)}
                  </span>
                  <span className="text-left">
                    <span className="block text-sm font-semibold">{displayName}</span>
                    <span className="text-atlas-muted block text-xs">{session.user.is_superuser ? "Super Admin" : "Operator"}</span>
                  </span>
                </button>

                {isSettingsOpen ? (
                  <div className="atlas-panel-strong absolute right-[calc(100%+12px)] top-[calc(100%+10px)] w-[320px] rounded-[28px] p-5">
                    <p className="text-sm font-semibold text-atlas">Platform Settings</p>
                    <button
                      type="button"
                      onClick={handleOpenIntegrations}
                      className="atlas-primary-button mt-4 w-full rounded-2xl px-4 py-3 text-sm font-semibold"
                    >
                      Open Integrations
                    </button>
                  </div>
                ) : null}

                {isProfileOpen ? (
                  <div className="atlas-panel-strong absolute right-0 top-[calc(100%+10px)] w-[320px] rounded-[28px] p-5">
                    <p className="text-lg font-semibold text-atlas">{displayName}</p>
                    <p className="mt-1 text-sm text-atlas-muted">{session.user.email}</p>
                    <div className="atlas-note mt-4 grid gap-3 rounded-2xl p-4">
                      <div>
                        <p className="text-atlas-accent text-[0.72rem] font-semibold uppercase tracking-[0.18em]">Role</p>
                        <p className="mt-1 text-sm font-medium text-atlas">{session.user.is_superuser ? "Super Admin" : "Operator"}</p>
                      </div>
                      <div>
                        <p className="text-atlas-accent text-[0.72rem] font-semibold uppercase tracking-[0.18em]">Status</p>
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
