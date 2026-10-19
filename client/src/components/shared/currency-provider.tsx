"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CurrencyCode } from "@/lib/format";

type CurrencyContextValue = {
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  toggleCurrency: () => void;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);
const storageKey = "ridex-currency";

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>("INR");

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (stored === "INR" || stored === "USD") {
      setCurrencyState(stored);
    }
  }, []);

  const setCurrency = useCallback((nextCurrency: CurrencyCode) => {
    setCurrencyState(nextCurrency);
    window.localStorage.setItem(storageKey, nextCurrency);
  }, []);

  const toggleCurrency = useCallback(() => {
    setCurrency(currency === "INR" ? "USD" : "INR");
  }, [currency, setCurrency]);

  const value = useMemo(
    () => ({ currency, setCurrency, toggleCurrency }),
    [currency, setCurrency, toggleCurrency],
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export const useCurrency = (): CurrencyContextValue => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used inside CurrencyProvider");
  }
  return context;
};
