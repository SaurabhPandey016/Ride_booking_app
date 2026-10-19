"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application rendering error:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-400">Something went wrong</p>
      <h1 className="mt-3 font-display text-3xl font-bold">We hit a bump in the road.</h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        Your data is safe. Try loading this page again.
      </p>
      <Button className="mt-7" onClick={reset}>Try again</Button>
    </main>
  );
}
