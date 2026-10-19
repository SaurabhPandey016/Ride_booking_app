"use client";

import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "./auth-provider";
import { CurrencyProvider } from "./currency-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CurrencyProvider>
        {children}
        <Toaster position="top-right" richColors theme="dark" />
      </CurrencyProvider>
    </AuthProvider>
  );
}
