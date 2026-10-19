"use client";

import { useEffect, type ReactNode } from "react";
import { api, getApiErrorStatus, normalizeApiError } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import type { AuthUser } from "@/types/auth";

type AuthResponse = {
  data: { user: AuthUser };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);
  const setAuthError = useAuthStore((state) => state.setAuthError);

  useEffect(() => {
    let active = true;

    const loadUser = async () => {
      try {
        const response = await api.get<AuthResponse>("/auth/me");
        if (active) {
          setUser(response.data.data.user);
        }
      } catch (error: unknown) {
        if (active && getApiErrorStatus(error) !== 401) {
          setUser(null);
          setAuthError(normalizeApiError(error).message);
        } else if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadUser();
    return () => {
      active = false;
    };
  }, [setAuthError, setLoading, setUser]);

  return children;
}
