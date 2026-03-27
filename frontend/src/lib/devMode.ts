import { useLocation, useNavigate } from "react-router-dom";

export const DEV_MODE_QUERY_PARAM = "dev_mode";

function normalizeDevModeValue(value: string | null) {
  if (value === "true" || value === "false") {
    return value;
  }

  return null;
}

export function readDevModeQueryValue(search: string) {
  return normalizeDevModeValue(new URLSearchParams(search).get(DEV_MODE_QUERY_PARAM));
}

export function isDevModeEnabled(search: string) {
  return readDevModeQueryValue(search) === "true";
}

export function withDevModeSearch(path: string, search: string) {
  const url = new URL(path, "http://sysatlas.local");
  const devModeValue = readDevModeQueryValue(search);

  if (devModeValue) {
    url.searchParams.set(DEV_MODE_QUERY_PARAM, devModeValue);
  } else {
    url.searchParams.delete(DEV_MODE_QUERY_PARAM);
  }

  return `${url.pathname}${url.search}${url.hash}`;
}

export function useDevModeUrlState() {
  const location = useLocation();
  const navigate = useNavigate();
  const devModeQueryValue = readDevModeQueryValue(location.search);
  const isDevMode = devModeQueryValue === "true";

  function setDevMode(enabled: boolean) {
    const nextSearchParams = new URLSearchParams(location.search);
    nextSearchParams.set(DEV_MODE_QUERY_PARAM, enabled ? "true" : "false");

    navigate(
      {
        pathname: location.pathname,
        search: `?${nextSearchParams.toString()}`,
        hash: location.hash,
      },
      { replace: true },
    );
  }

  function withDevMode(path: string) {
    return withDevModeSearch(path, location.search);
  }

  return {
    devModeQueryValue,
    isDevMode,
    setDevMode,
    withDevMode,
  };
}
