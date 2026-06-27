"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  getCurrentUser,
  logout as apiLogout,
  getAuthToken,
  setAuthToken,
} from "@/lib/api";
import { login as apiLogin } from "@/lib/api/auth";

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  consent_given: boolean;
  consent_camera: boolean;
  consent_microphone: boolean;
  consent_analytics: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (token: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    bootstrapAuthFromUrl();
  }, []);

  function bootstrapAuthFromUrl() {
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }

    const url = new URL(window.location.href);

    // Dev shortcut: append ?dev to any page URL on localhost to skip login.
    // Credentials come from NEXT_PUBLIC_DEV_EMAIL / NEXT_PUBLIC_DEV_PASSWORD
    // in .env.local (never committed, never present in production builds).
    const isLocalhost =
      process.env.NODE_ENV === "development" &&
      (url.hostname === "localhost" || url.hostname === "127.0.0.1");
    if (isLocalhost && url.searchParams.has("dev")) {
      url.searchParams.delete("dev");
      window.history.replaceState({}, "", url.toString());
      void devAutoLogin();
      return;
    }

    const sessionToken =
      url.searchParams.get("session_token") ||
      url.searchParams.get("token") ||
      url.searchParams.get("auth_token");

    if (sessionToken) {
      setAuthToken(sessionToken);

      url.searchParams.delete("session_token");
      url.searchParams.delete("token");
      url.searchParams.delete("auth_token");
      window.history.replaceState({}, "", url.toString());
    }

    void checkAuth();
  }

  async function devAutoLogin() {
    const email = process.env.NEXT_PUBLIC_DEV_EMAIL;
    const password = process.env.NEXT_PUBLIC_DEV_PASSWORD;
    if (!email || !password) {
      console.warn(
        "[dev] ?dev shortcut: set NEXT_PUBLIC_DEV_EMAIL and NEXT_PUBLIC_DEV_PASSWORD in .env.local",
      );
      setLoading(false);
      return;
    }
    try {
      await apiLogin({ email, password });
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (err) {
      console.error("[dev] Auto-login failed:", err);
    }
    setLoading(false);
  }

  async function checkAuth() {
    const token = getAuthToken();
    if (token) {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        setError(null);
      } catch (err) {
        console.error("Auth check failed:", err);
        setUser(null);
      }
    }
    setLoading(false);
  }

  async function login(token: string) {
    setLoading(true);
    setError(null);
    try {
      setAuthToken(token);
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (err: any) {
      setError(err.message || "Failed to get user data");
      throw err;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    apiLogout();
    setUser(null);
  }

  async function refreshUser() {
    if (!user) return;
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (err) {
      console.error("Failed to refresh user:", err);
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, error, login, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
