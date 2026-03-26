const workflowSteps = [
  "Connect tenant systems without storing anything in git",
  "Choose an employee and assemble a workflow by system",
  "Launch onboarding or offboarding actions from one workspace",
];

const integrations = [
  "Microsoft Intune",
  "Active Directory",
  "Entra ID",
  "Microsoft 365",
  "Zoom",
  "Zoho",
  "Verizon",
  "Community Connectors",
];

const dashboardSignals = [
  { label: "Workflows ready", value: "12" },
  { label: "Connectors planned", value: "20+" },
  { label: "Open source posture", value: "Public" },
];

const heroImage =
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80";

function App() {
  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-atlas-ink text-atlas-mist">
      <div className="pointer-events-none absolute inset-0 grid-sheen opacity-30 animate-gridPan" />
      <div className="pointer-events-none absolute -left-20 top-16 h-72 w-72 rounded-full bg-atlas-glow/20 blur-3xl animate-drift" />
      <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl animate-pulseGlow" />
      <div className="pointer-events-none absolute bottom-0 right-24 h-64 w-64 rounded-full bg-atlas-gold/10 blur-3xl animate-float" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6 lg:px-10">
        <header className="flex items-center justify-between rounded-full border border-white/10 bg-white/5 px-5 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-atlas-glow/90 to-cyan-500/60 font-display text-lg font-bold text-atlas-ink shadow-panel">
              SA
            </div>
            <div>
              <p className="font-display text-lg font-bold text-white">SysAtlas</p>
              <p className="text-sm text-atlas-mist/70">
                Systems automation for modern IT teams
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-3 text-sm text-atlas-mist/70 md:flex">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
              Open source
            </span>
            <span className="rounded-full border border-atlas-glow/30 bg-atlas-glow/10 px-3 py-1.5 text-atlas-glow">
              Public-ready architecture
            </span>
          </div>
        </header>

        <main className="flex flex-1 items-center py-10">
          <div className="grid w-full gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-panel backdrop-blur-xl lg:p-10">
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-atlas-gold/30 bg-atlas-gold/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.24em] text-atlas-gold">
                Community-built admin orchestration
              </div>

              <div className="grid gap-8 xl:grid-cols-[1fr_280px]">
                <div>
                  <h1 className="max-w-3xl font-display text-4xl font-bold leading-tight text-white md:text-6xl">
                    One place to run onboarding, offboarding, and every system touchpoint in between.
                  </h1>
                  <p className="mt-6 max-w-2xl text-lg leading-8 text-atlas-mist/78">
                    SysAtlas is designed to let teams connect the systems they actually use, then build precise admin
                    flows for hires, exits, and day-two operations without paying for a monolith they do not want.
                  </p>

                  <div className="mt-8 grid gap-4 md:grid-cols-3">
                    {dashboardSignals.map((signal) => (
                      <div
                        key={signal.label}
                        className="rounded-3xl border border-white/10 bg-atlas-panel/80 p-5"
                      >
                        <p className="text-sm uppercase tracking-[0.22em] text-atlas-mist/55">{signal.label}</p>
                        <p className="mt-3 font-display text-3xl font-bold text-white">{signal.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 rounded-[28px] border border-white/10 bg-atlas-ink/70 p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm uppercase tracking-[0.24em] text-atlas-glow">Workflow preview</p>
                        <h2 className="mt-2 font-display text-2xl font-semibold text-white">
                          Offboard once, orchestrate everywhere
                        </h2>
                      </div>
                      <div className="rounded-full border border-atlas-glow/20 bg-atlas-glow/10 px-4 py-2 text-sm font-medium text-atlas-glow">
                        Integration controls arrive next
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4">
                      {workflowSteps.map((step, index) => (
                        <div
                          key={step}
                          className="flex items-start gap-4 rounded-2xl border border-white/8 bg-white/[0.03] p-4"
                        >
                          <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 font-display text-sm font-bold text-white">
                            0{index + 1}
                          </div>
                          <p className="text-base leading-7 text-atlas-mist/80">{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-atlas-glow/25 blur-3xl" />
                  <div className="absolute -bottom-6 left-4 h-28 w-28 rounded-full bg-atlas-gold/20 blur-3xl" />
                  <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-atlas-panel/80 p-4 animate-float">
                    <div
                      className="h-64 rounded-[22px] bg-cover bg-center"
                      style={{ backgroundImage: `linear-gradient(180deg, rgba(7, 17, 31, 0.05), rgba(7, 17, 31, 0.5)), url(${heroImage})` }}
                    />
                    <div className="mt-4 rounded-[22px] border border-white/10 bg-atlas-ink/80 p-4">
                      <p className="text-sm uppercase tracking-[0.22em] text-atlas-mist/55">Planned integration map</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {integrations.map((integration) => (
                          <span
                            key={integration}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-atlas-mist/80"
                          >
                            {integration}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="relative rounded-[32px] border border-white/10 bg-slate-950/80 p-8 shadow-panel backdrop-blur-xl">
              <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-atlas-glow/70 to-transparent" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.28em] text-atlas-glow">Portal access</p>
                  <h2 className="mt-3 font-display text-3xl font-bold text-white">Sign in to your SysAtlas</h2>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-[0.22em] text-atlas-mist/65">
                  Private workspace
                </div>
              </div>

              <p className="mt-4 max-w-md text-base leading-7 text-atlas-mist/72">
                This front door is ready for JWT, OIDC, or provider-specific SSO once we wire the authentication flow in
                the next step.
              </p>

              <form
                className="mt-8 space-y-5"
                onSubmit={(event) => {
                  event.preventDefault();
                }}
              >
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-atlas-mist/70">Work email</span>
                  <input
                    type="email"
                    placeholder="you@company.com"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-atlas-glow/70 focus:bg-white/10"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-atlas-mist/70">Password</span>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-atlas-glow/70 focus:bg-white/10"
                  />
                </label>

                <div className="flex items-center justify-between text-sm text-atlas-mist/65">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="h-4 w-4 rounded border-white/20 bg-white/10 accent-teal-400" />
                    Keep me signed in
                  </label>
                  <button type="button" className="text-atlas-gold transition hover:text-yellow-200">
                    Need access?
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-gradient-to-r from-atlas-glow to-cyan-400 px-4 py-3 font-semibold text-atlas-ink transition hover:translate-y-[-1px] hover:shadow-[0_18px_40px_rgba(45,212,191,0.25)]"
                >
                  Enter SysAtlas
                </button>

                <button
                  type="button"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-white transition hover:bg-white/10"
                >
                  Use enterprise sign-in
                </button>
              </form>

              <div className="mt-8 grid gap-4 rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-center justify-between">
                  <p className="font-display text-xl font-semibold text-white">What ships in this foundation</p>
                  <span className="rounded-full border border-atlas-gold/25 bg-atlas-gold/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-atlas-gold">
                    Step one
                  </span>
                </div>

                <div className="grid gap-3 text-sm leading-6 text-atlas-mist/75">
                  <div className="rounded-2xl border border-white/8 bg-atlas-panel/50 p-4">
                    Frontend shell for login, hero storytelling, and future dashboard handoff
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-atlas-panel/50 p-4">
                    FastAPI backend with health and metadata endpoints for the app foundation
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-atlas-panel/50 p-4">
                    Docker-first Postgres stack that keeps deployment secrets outside the repo
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
