import { create } from "zustand";
import type { AuthUser } from "@/types/auth";

type AuthState = {
  user: AuthUser | null;
  isLoading: boolean;
  authError: string | null;
  setUser: (user: AuthUser | null) => void;
  setLoading: (isLoading: boolean) => void;
  setAuthError: (authError: string | null) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  authError: null,
  setUser: (user) => set({ user, authError: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setAuthError: (authError) => set({ authError }),
  clearAuth: () => set({ user: null, authError: null }),
}));
