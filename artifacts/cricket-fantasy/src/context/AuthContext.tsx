import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { apiJson, apiFetch, storeAuthToken, clearAuthToken, ApiError } from "../lib/api";

interface AuthUser {
  id: number;
  email: string;
  name: string;
  isAdmin?: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    // Resilient auth check: only an explicit 401/403 means "really logged out".
    // Network errors and 5xx (e.g., backend warming up after a fresh deploy)
    // are treated as transient and retried with backoff so users do not get
    // bounced to the login screen every time we republish the app.
    const MAX_ATTEMPTS = 3;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      try {
        const me = await apiJson<AuthUser>("/auth/me");
        setUser(me);
        return;
      } catch (err) {
        const status = err instanceof ApiError ? err.status : 0;
        const isAuthFailure = status === 401 || status === 403;
        if (isAuthFailure) {
          // Real auth failure — token (if any) is invalid; clear and stop.
          clearAuthToken();
          setUser(null);
          return;
        }
        // Transient (network down, 5xx, server warming up). Back off and retry.
        if (attempt < MAX_ATTEMPTS - 1) {
          await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
          continue;
        }
        // Out of retries — leave user null but DO NOT clear the token, so
        // the next page load can try again with the same credentials.
        setUser(null);
        return;
      }
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const login = useCallback(async (email: string, password: string, rememberMe = true) => {
    const me = await apiJson<AuthUser & { token?: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, rememberMe }),
    });
    // Store token in localStorage for iOS (Safari clears cookies aggressively)
    if (rememberMe && me.token) {
      storeAuthToken(me.token);
    } else {
      clearAuthToken();
    }
    const { token: _t, ...user } = me;
    setUser(user);
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    const me = await apiJson<AuthUser & { token?: string }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    // Always remember after signup
    if (me.token) storeAuthToken(me.token);
    const { token: _t, ...user } = me;
    setUser(user);
  }, []);

  const logout = useCallback(async () => {
    clearAuthToken();
    await apiFetch("/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
