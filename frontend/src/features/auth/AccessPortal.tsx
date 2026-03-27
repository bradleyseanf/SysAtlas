import { useState, type ChangeEvent, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

import loginWaves from "../../../assets/login-waves.lottie";
import { api } from "../../lib/api";
import { useAuth } from "./AuthContext";
import type { SetupStatus } from "../../types/api";

type AccessPortalProps = {
  setupStatus: SetupStatus | null;
  isLoading: boolean;
  error: string;
};

type SetupFormState = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirm_password: string;
};

type LoginFormState = {
  email: string;
  password: string;
};

const initialSetupForm: SetupFormState = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  confirm_password: "",
};

const initialLoginForm: LoginFormState = {
  email: "",
  password: "",
};

function fieldClassName() {
  return "w-full rounded-2xl border border-[#6d3d47] bg-[rgba(90,39,49,0.34)] px-4 py-3.5 text-[#f8edf0] outline-none transition placeholder:text-[#cfaeb6]/40 focus:border-[#d55472] focus:bg-[rgba(98,40,51,0.46)]";
}

export function AccessPortal({ setupStatus, isLoading, error }: AccessPortalProps) {
  const queryClient = useQueryClient();
  const { signIn } = useAuth();
  const [setupForm, setSetupForm] = useState<SetupFormState>(initialSetupForm);
  const [loginForm, setLoginForm] = useState<LoginFormState>(initialLoginForm);
  const [formError, setFormError] = useState("");

  const setupMutation = useMutation({
    mutationFn: api.bootstrap,
    onSuccess: (response) => {
      setFormError("");
      signIn(response);
      void queryClient.invalidateQueries({ queryKey: ["auth", "setup-status"] });
    },
    onError: (mutationError) => {
      setFormError(mutationError instanceof Error ? mutationError.message : "Unable to initialize SysAtlas.");
    },
  });

  const loginMutation = useMutation({
    mutationFn: api.login,
    onSuccess: (response) => {
      setFormError("");
      signIn(response);
    },
    onError: (mutationError) => {
      setFormError(mutationError instanceof Error ? mutationError.message : "Unable to sign in.");
    },
  });

  const setupRequired = setupStatus?.setup_required ?? false;

  function handleSetupFieldChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setSetupForm((current) => ({ ...current, [name]: value }));
  }

  function handleLoginFieldChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setLoginForm((current) => ({ ...current, [name]: value }));
  }

  function handleSetupSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (setupForm.password !== setupForm.confirm_password) {
      setFormError("Passwords do not match.");
      return;
    }

    setupMutation.mutate({
      first_name: setupForm.first_name,
      last_name: setupForm.last_name,
      email: setupForm.email,
      password: setupForm.password,
    });
  }

  function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    loginMutation.mutate(loginForm);
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0f1114] text-atlas-mist">
      <div className="pointer-events-none absolute inset-0 grid-sheen opacity-20" />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.04),transparent_22%),linear-gradient(180deg,rgba(15,17,20,0.92),rgba(11,12,15,0.98))]" />
        <DotLottieReact
          src={loginWaves}
          autoplay
          loop
          speed={0.75}
          useFrameInterpolation={false}
          renderConfig={{ autoResize: true, devicePixelRatio: 1.25 }}
          className="absolute inset-[-18%] h-[136%] w-[136%] opacity-[0.18] mix-blend-screen"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(15,17,20,0.12)_44%,rgba(11,12,15,0.54)_100%)]" />
      </div>

      <main className="relative mx-auto flex min-h-screen max-w-6xl items-center px-6 py-12 lg:px-10">
        <div className="grid w-full items-start gap-8 lg:grid-cols-[1fr_minmax(0,620px)]">
          <section className="hidden lg:block">
            <div className="max-w-xl rounded-[32px] border border-white/10 bg-[rgba(20,11,15,0.42)] p-8 backdrop-blur-[12px]">
              <p className="text-[0.78rem] font-semibold uppercase tracking-[0.28em] text-[#d55472]">
                {setupRequired ? "First Launch" : "Portal Access"}
              </p>
              <div className="mt-5 space-y-4">
                <h1 className="text-5xl font-semibold leading-[0.96] tracking-[-0.05em] text-[#f8edf0]">
                  SysAtlas
                </h1>
                <p className="max-w-xl text-base leading-8 text-[#f3dce1]/78">
                  Systems Atlas (A.T.L.A.S) - Systems Automation Tool Linking All Systems. One control plane for user lifecycle,
                  device management, and external platform orchestration.
                </p>
              </div>

              <div className="mt-8 grid gap-4">
                <article className="rounded-3xl border border-white/10 bg-black/10 p-5">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#cf6a7f]">Users</p>
                  <p className="mt-2 text-sm leading-7 text-[#f3dce1]/72">
                    Directory-backed user inventory, onboarding, and offboarding workflows with source-aware empty states.
                  </p>
                </article>
                <article className="rounded-3xl border border-white/10 bg-black/10 p-5">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#cf6a7f]">Devices</p>
                  <p className="mt-2 text-sm leading-7 text-[#f3dce1]/72">
                    Endpoint inventory and compliance views that feel like real admin tooling rather than a marketing mockup.
                  </p>
                </article>
                <article className="rounded-3xl border border-white/10 bg-black/10 p-5">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#cf6a7f]">Integrations</p>
                  <p className="mt-2 text-sm leading-7 text-[#f3dce1]/72">
                    AD, Intune, Microsoft 365, Entra, Exchange, Zoho, Zoom, and Verizon setup with encrypted database-backed secrets.
                  </p>
                </article>
              </div>
            </div>
          </section>

          <section className="w-full rounded-[32px] border border-white/20 bg-[rgba(29,16,21,0.78)] p-8 shadow-[0_28px_80px_rgba(18,6,10,0.52)] backdrop-blur-[18px] lg:p-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[0.78rem] font-semibold uppercase tracking-[0.28em] text-[#d55472]">
                  {setupRequired ? "Initialize Workspace" : "Portal Access"}
                </p>
                <div className="mt-5 space-y-4">
                  <h2 className="text-4xl font-semibold leading-[1.02] tracking-[-0.04em] text-[#f8edf0] md:text-[3.2rem]">
                    {setupRequired ? "Welcome to SysAtlas, let's get started." : "Welcome back."}
                  </h2>
                  <p className="max-w-2xl text-base leading-7 text-[#f3dce1]/78 md:text-lg">
                    {setupRequired
                      ? "Create the first super admin account and unlock the main workspace."
                      : "Sign in with your SysAtlas account to continue into the integrated admin console."}
                  </p>
                </div>
              </div>
              <span className="rounded-full border border-[#df6f87]/25 bg-[rgba(215,84,114,0.12)] px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#f2c8d1]">
                {setupStatus ? `${setupStatus.user_count} account${setupStatus.user_count === 1 ? "" : "s"} configured` : "Checking instance"}
              </span>
            </div>

            {isLoading ? (
              <div className="mt-10 rounded-3xl border border-white/10 bg-black/10 px-5 py-8 text-center text-sm text-[#f3dce1]/72">
                Checking whether this instance has been initialized...
              </div>
            ) : (
              <div className="mt-10">
                {error ? (
                  <div className="mb-5 rounded-3xl border border-[#d55472]/30 bg-[rgba(123,30,52,0.18)] px-4 py-3 text-sm leading-6 text-[#fde6eb]">
                    {error}
                  </div>
                ) : null}

                {formError ? (
                  <div className="mb-5 rounded-3xl border border-[#d55472]/30 bg-[rgba(123,30,52,0.18)] px-4 py-3 text-sm leading-6 text-[#fde6eb]">
                    {formError}
                  </div>
                ) : null}

                {setupRequired ? (
                  <form className="space-y-5" onSubmit={handleSetupSubmit}>
                    <div className="grid gap-5 md:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 block text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-[#cf6a7f]">
                          First Name
                        </span>
                        <input
                          name="first_name"
                          type="text"
                          value={setupForm.first_name}
                          onChange={handleSetupFieldChange}
                          placeholder="Avery"
                          className={fieldClassName()}
                          required
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-[#cf6a7f]">
                          Last Name
                        </span>
                        <input
                          name="last_name"
                          type="text"
                          value={setupForm.last_name}
                          onChange={handleSetupFieldChange}
                          placeholder="Morgan"
                          className={fieldClassName()}
                          required
                        />
                      </label>
                    </div>

                    <label className="block">
                      <span className="mb-2 block text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-[#cf6a7f]">
                        Email
                      </span>
                      <input
                        name="email"
                        type="email"
                        value={setupForm.email}
                        onChange={handleSetupFieldChange}
                        placeholder="admin@your-company.com"
                        className={fieldClassName()}
                        required
                      />
                    </label>

                    <div className="grid gap-5 md:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 block text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-[#cf6a7f]">
                          Password
                        </span>
                        <input
                          name="password"
                          type="password"
                          value={setupForm.password}
                          onChange={handleSetupFieldChange}
                          placeholder="At least 12 characters"
                          className={fieldClassName()}
                          minLength={12}
                          required
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-[#cf6a7f]">
                          Confirm Password
                        </span>
                        <input
                          name="confirm_password"
                          type="password"
                          value={setupForm.confirm_password}
                          onChange={handleSetupFieldChange}
                          placeholder="Repeat your password"
                          className={fieldClassName()}
                          minLength={12}
                          required
                        />
                      </label>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-black/10 px-4 py-3 text-sm leading-6 text-[#f3dce1]/72">
                      This account becomes the first SysAtlas super admin and receives full system permissions.
                    </div>

                    <button
                      type="submit"
                      disabled={setupMutation.isPending}
                      className="w-full rounded-2xl border border-[#df6f87]/35 bg-[#c73e59] px-4 py-3.5 text-base font-semibold tracking-[0.08em] text-[#fff7f8] transition hover:bg-[#d55472] hover:shadow-[0_18px_40px_rgba(199,62,89,0.32)] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {setupMutation.isPending ? "Creating Super Admin..." : "Initialize SysAtlas"}
                    </button>
                  </form>
                ) : (
                  <form className="space-y-5" onSubmit={handleLoginSubmit}>
                    <label className="block">
                      <span className="mb-2 block text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-[#cf6a7f]">
                        Email
                      </span>
                      <input
                        name="email"
                        type="email"
                        value={loginForm.email}
                        onChange={handleLoginFieldChange}
                        placeholder="Enter your email"
                        className={fieldClassName()}
                        required
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-[#cf6a7f]">
                        Password
                      </span>
                      <input
                        name="password"
                        type="password"
                        value={loginForm.password}
                        onChange={handleLoginFieldChange}
                        placeholder="Enter your password"
                        className={fieldClassName()}
                        required
                      />
                    </label>

                    <div className="rounded-3xl border border-white/10 bg-black/10 px-4 py-3 text-sm leading-6 text-[#f3dce1]/72">
                      Fresh instances are redirected into setup automatically. Integration credentials stay separate and are stored encrypted in the database.
                    </div>

                    <button
                      type="submit"
                      disabled={loginMutation.isPending}
                      className="w-full rounded-2xl border border-[#df6f87]/35 bg-[#c73e59] px-4 py-3.5 text-base font-semibold tracking-[0.08em] text-[#fff7f8] transition hover:bg-[#d55472] hover:shadow-[0_18px_40px_rgba(199,62,89,0.32)] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {loginMutation.isPending ? "Signing In..." : "Sign In"}
                    </button>
                  </form>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
