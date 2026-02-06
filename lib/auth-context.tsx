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

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
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
      void checkAuth();
      return;
    }

    const url = new URL(window.location.href);
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
