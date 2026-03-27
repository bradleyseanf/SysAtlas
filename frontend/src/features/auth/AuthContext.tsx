import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { api } from "../../lib/api";
import type { AuthResponse, AuthUser } from "../../types/api";

type AuthSession = {
  user: AuthUser;
};

type AuthContextValue = {
  isReady: boolean;
  session: AuthSession | null;
  signIn: (response: AuthResponse) => void;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isReady, setIsReady] = useState(false);

  async function refreshSession() {
    try {
      const response = await api.getCurrentSession();
      setSession({ user: response.user });
    } catch {
      setSession(null);
    } finally {
      setIsReady(true);
    }
  }

  useEffect(() => {
    let isActive = true;

    async function restoreSession() {
      try {
        const response = await api.getCurrentSession();
        if (isActive) {
          setSession({ user: response.user });
        }
      } catch {
        if (!isActive) {
          return;
        }

        setSession(null);
      } finally {
        if (isActive) {
          setIsReady(true);
        }
      }
    }

    void restoreSession();

    return () => {
      isActive = false;
    };
  }, []);

  function signIn(response: AuthResponse) {
    setSession({
      user: response.user,
    });
    setIsReady(true);
  }

  async function signOut() {
    try {
      await api.logout();
    } finally {
      setSession(null);
      setIsReady(true);
    }
  }

  return <AuthContext.Provider value={{ isReady, session, signIn, signOut, refreshSession }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return value;
}
