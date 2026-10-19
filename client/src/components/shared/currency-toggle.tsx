"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCurrency } from "./currency-provider";

export function CurrencyToggle({ compact = false }: { compact?: boolean }) {
  const { currency, setCurrency } = useCurrency();
  return (
    <div
      role="group"
      aria-label="Display currency"
      className="inline-flex h-9 items-center rounded-full border border-white/10 bg-white/[0.035] p-0.5"
    >
      {(["INR", "USD"] as const).map((option) => (
        <Button
          key={option}
          type="button"
          variant="ghost"
          size="sm"
          aria-pressed={currency === option}
          onClick={() => setCurrency(option)}
          className={cn(
            "h-8 rounded-full px-2.5 text-xs hover:bg-white/5",
            currency === option && "bg-red-500/15 text-red-200 hover:bg-red-500/20",
          )}
        >
          {compact ? option === "INR" ? "₹" : "$" : option}
        </Button>
      ))}
    </div>
  );
}
