"use client";

import { ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrency } from "./currency-provider";

export function CurrencyToggle() {
  const { currency, toggleCurrency } = useCurrency();
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="rounded-full border-white/10 bg-white/[0.03]"
      onClick={toggleCurrency}
      aria-label={`Switch display currency from ${currency}`}
    >
      <ArrowLeftRight aria-hidden="true" className="h-3.5 w-3.5" />
      {currency}
    </Button>
  );
}
