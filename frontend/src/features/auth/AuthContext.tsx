import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { setApiAccessToken } from "../../lib/api";
import type { AuthResponse, AuthUser } from "../../types/api";

type AuthSession = {
  token: string;
  user: AuthUser;
};

type AuthContextValue = {
  session: AuthSession | null;
  signIn: (response: AuthResponse) => void;
  signOut: () => void;
};

const SESSION_STORAGE_KEY = "sysatlas.session";

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredSession(): AuthSession | null {
  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => readStoredSession());

  useEffect(() => {
    setApiAccessToken(session?.token ?? null);

    if (session) {
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      return;
    }

    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  }, [session]);

  function signIn(response: AuthResponse) {
    setSession({
      token: response.access_token,
      user: response.user,
    });
  }

  function signOut() {
    setSession(null);
  }

  return <AuthContext.Provider value={{ session, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return value;
}
