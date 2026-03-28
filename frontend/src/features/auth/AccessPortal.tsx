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
  return "w-full rounded-xl border border-white/10 bg-[#121821] px-4 py-3 text-[#f5f7fa] outline-none transition placeholder:text-white/30 focus:border-[#c94a63] focus:ring-2 focus:ring-[#c94a63]/15";
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
    <div className="access-portal relative min-h-screen overflow-hidden bg-[#0c1015] text-[#f5f7fa]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,16,21,0.86),rgba(12,16,21,0.96))]" />
        <DotLottieReact
          src={loginWaves}
          autoplay
          loop
          speed={0.75}
          useFrameInterpolation={false}
          renderConfig={{ autoResize: true, devicePixelRatio: 1.25 }}
          className="absolute inset-[-18%] h-[136%] w-[136%] opacity-[0.16] mix-blend-screen"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(12,16,21,0.08)_42%,rgba(12,16,21,0.52)_100%)]" />
      </div>

      <main className="relative mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-6 py-10">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#c94a63]/10 blur-[120px]" />

        <section
          className={`relative w-full rounded-[28px] border border-white/10 bg-[#11161d]/95 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.38)] backdrop-blur sm:p-8 ${
            setupRequired ? "max-w-2xl" : "max-w-md"
          }`}
        >
          <div className="space-y-1.5">
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-white">SysAtlas</h1>
            <p className="text-sm leading-6 text-white/60">
              {setupRequired
                ? "Create the first super admin account to unlock the workspace."
                : "Systems Atlas (A.T.L.A.S.) - Systems Automation Tool Linking All Systems."}
            </p>
            {setupRequired ? (
              <p className="pt-1 text-xs uppercase tracking-[0.16em] text-white/45">Create administrator account</p>
            ) : null}
          </div>

          {isLoading ? (
            <div className="mt-6 rounded-xl border border-white/10 bg-black/10 px-4 py-6 text-center text-sm text-white/60">
              Checking whether this instance has been initialized...
            </div>
          ) : (
            <div className="mt-6">
              {error ? (
                <div className="mb-4 rounded-xl border border-[#c94a63]/35 bg-[#c94a63]/10 px-4 py-3 text-sm leading-6 text-[#ffdfe5]">
                  {error}
                </div>
              ) : null}

              {formError ? (
                <div className="mb-4 rounded-xl border border-[#c94a63]/35 bg-[#c94a63]/10 px-4 py-3 text-sm leading-6 text-[#ffdfe5]">
                  {formError}
                </div>
              ) : null}

              {setupRequired ? (
                <form className="space-y-4" onSubmit={handleSetupSubmit}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-white/55">
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
                      <span className="mb-2 block text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-white/55">
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
                    <span className="mb-2 block text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-white/55">
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

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-white/55">
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
                      <span className="mb-2 block text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-white/55">
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

                  <button
                    type="submit"
                    disabled={setupMutation.isPending}
                    className="w-full rounded-xl bg-[#c94a63] px-4 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-[#d55d74] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {setupMutation.isPending ? "Creating Super Admin..." : "Initialize SysAtlas"}
                  </button>
                </form>
              ) : (
                <form className="space-y-4" onSubmit={handleLoginSubmit}>
                  <label className="block">
                    <span className="mb-2 block text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-white/55">
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
                    <span className="mb-2 block text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-white/55">
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

                  <button
                    type="submit"
                    disabled={loginMutation.isPending}
                    className="w-full rounded-xl bg-[#c94a63] px-4 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-[#d55d74] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loginMutation.isPending ? "Signing In..." : "Sign In"}
                  </button>
                </form>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
