"use client";

import * as React from "react";
import { authAdapter } from "@/lib/auth/auth-adapter";
import type { LoginInput, RegisterInput, Session } from "@/lib/auth/types";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  status: AuthStatus;
  session: Session | null;
  login: (input: LoginInput) => Promise<Session>;
  register: (input: RegisterInput) => Promise<Session>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

/** How often to re-check session expiry while a tab stays open. */
const EXPIRY_CHECK_INTERVAL_MS = 60_000;

/**
 * Mounted once at the root layout. Reads the mock session from
 * localStorage on mount (hence the initial "loading" status — this can't
 * happen during SSR), and polls for expiry so a session that lapses while
 * the tab is open actually logs the user out instead of silently going
 * stale. See docs/AUTHENTICATION.md.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = React.useState<AuthStatus>("loading");
  const [session, setSession] = React.useState<Session | null>(null);

  const refresh = React.useCallback(() => {
    const current = authAdapter.getSession();
    setSession(current);
    setStatus(current ? "authenticated" : "unauthenticated");
  }, []);

  React.useEffect(() => {
    refresh();
    const interval = setInterval(refresh, EXPIRY_CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  const login = React.useCallback(async (input: LoginInput) => {
    const newSession = await authAdapter.login(input);
    setSession(newSession);
    setStatus("authenticated");
    return newSession;
  }, []);

  const register = React.useCallback(async (input: RegisterInput) => {
    const newSession = await authAdapter.register(input);
    setSession(newSession);
    setStatus("authenticated");
    return newSession;
  }, []);

  const logout = React.useCallback(async () => {
    await authAdapter.logout();
    setSession(null);
    setStatus("unauthenticated");
  }, []);

  return (
    <AuthContext.Provider value={{ status, session, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useSession() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useSession must be used within <AuthProvider>");
  return ctx;
}
