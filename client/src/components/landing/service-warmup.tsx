"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { AlertTriangle, CheckCircle2, LoaderCircle, Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

type HealthResponse = {
  message?: string;
  data?: {
    status?: "ok" | "degraded";
    services?: {
      api?: "available";
      database?: "available" | "unavailable";
    };
  };
};

type WarmupState = {
  phase: "checking" | "warming" | "ready";
  databaseUnavailable?: boolean;
};

export function ServiceWarmup() {
  const [state, setState] = useState<WarmupState>({ phase: "checking" });
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let active = true;
    let retryTimer: number | undefined;
    let attempt = 0;
    const controller = new AbortController();

    const checkServices = async (): Promise<void> => {
      try {
        const response = await api.get<HealthResponse>("/health", {
          timeout: 30000,
          signal: controller.signal,
        });
        if (!active) return;

        if (response.data.data?.status === "ok") {
          setState({ phase: "ready" });
          return;
        }

        setState({
          phase: "warming",
          databaseUnavailable:
            response.data.data?.services?.database === "unavailable",
        });
      } catch (error: unknown) {
        if (!active || controller.signal.aborted) return;
        const responseData = axios.isAxiosError<HealthResponse>(error)
          ? error.response?.data
          : undefined;

        setState({
          phase: "warming",
          databaseUnavailable:
            responseData?.data?.services?.database === "unavailable",
        });
      }

      attempt += 1;
      const delay = Math.min(5000 * 2 ** Math.min(attempt - 1, 2), 20000);
      retryTimer = window.setTimeout(() => void checkServices(), delay);
    };

    setState({ phase: "checking" });
    void checkServices();

    return () => {
      active = false;
      controller.abort();
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
    };
  }, [retryToken]);

  if (state.phase === "ready") {
    return (
      <div
        className="mx-auto mb-6 flex max-w-7xl items-center gap-2 px-5 text-xs text-emerald-300 sm:px-8 lg:px-10"
        role="status"
      >
        <CheckCircle2 aria-hidden="true" className="h-4 w-4 shrink-0" />
        Demo services are ready.
      </div>
    );
  }

  const waitingForDatabase = state.databaseUnavailable === true;

  return (
    <section
      className="mx-auto mb-6 max-w-7xl px-4 sm:px-8 lg:px-10"
      aria-live="polite"
      aria-busy={state.phase === "checking"}
    >
      <div className="flex flex-col gap-4 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-start gap-3">
          {state.phase === "checking" ? (
            <LoaderCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-amber-300" />
          ) : (
            <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
          )}
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-amber-100">
              {state.phase === "checking"
                ? "Connecting to the RideX demo"
                : waitingForDatabase
                  ? "The API is awake; Supabase is still starting"
                  : "The free demo service is waking up"}
            </h2>
            <p className="mt-1 text-xs leading-5 text-amber-100/70 sm:text-sm">
              {state.phase === "checking"
                ? "The first check can take a little while after inactivity. Render may be waking the API, and Supabase may be resuming the database."
                : waitingForDatabase
                  ? "Ride and account data are temporarily unavailable until the database reconnects. RideX is checking again automatically."
                  : "Render free services can sleep after inactivity. Requests may be delayed while the API starts; RideX is retrying automatically."}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-300">
              <a
                className="inline-flex min-h-11 items-center gap-2 underline decoration-white/20 underline-offset-4 hover:text-white"
                href="mailto:developersaurabh001@gmail.com?subject=RideX%20demo"
              >
                <Mail aria-hidden="true" className="h-4 w-4" />
                Contact Saurabh for a demo
              </a>
              <span>LinkedIn video walkthrough link coming soon.</span>
            </div>
          </div>
        </div>
        {state.phase === "warming" && (
          <Button
            type="button"
            variant="outline"
            className="min-h-11 shrink-0 border-amber-300/20 bg-black/20 text-amber-100 hover:bg-amber-300/10"
            onClick={() => setRetryToken((value) => value + 1)}
          >
            <RefreshCw aria-hidden="true" className="h-4 w-4" />
            Check again
          </Button>
        )}
      </div>
    </section>
  );
}
