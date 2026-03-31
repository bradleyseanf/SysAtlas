export const STATIC_DEMO_QUERY_PARAM = "dev_mode";

function readHostname() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.location.hostname.toLowerCase();
}

function readEnvFlag(flag: string) {
  const value = import.meta.env[flag];

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value === "true" || value === "1";
  }

  return false;
}

export function isHostedStaticDemoMode() {
  const hostname = readHostname();

  return readEnvFlag("VITE_FORCE_STATIC_DEMO") || hostname.endsWith(".vercel.app");
}

export function isHostedEnvironment() {
  return isHostedStaticDemoMode();
}
