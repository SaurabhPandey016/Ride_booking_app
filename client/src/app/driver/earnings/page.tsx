"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Coins, LoaderCircle, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  EarningsChart,
  EarningCard,
  type DriverEarningsData,
} from "@/components/driver/driver-dashboard";
import { ProtectedRoute } from "@/components/shared/protected-route";
import { api, normalizeApiError } from "@/lib/api";

type EarningsResponse = { data: { earnings: DriverEarningsData } };

function EarningsContent() {
  const [earnings, setEarnings] = useState<DriverEarningsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadEarnings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<EarningsResponse>("/driver/earnings");
      setEarnings(response.data.data.earnings);
    } catch (requestError: unknown) {
      setError(normalizeApiError(requestError).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEarnings();
  }, [loadEarnings]);

  return (
    <main className="mx-auto min-h-[65vh] max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <Button asChild variant="ghost" className="mb-6 text-zinc-400 hover:text-white">
        <Link href="/driver"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Back to dashboard</Link>
      </Button>
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-300">Driver space</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-white">Earnings</h1>
      <p className="mt-2 text-sm text-zinc-400">Your payouts from completed, paid rides.</p>

      {loading ? (
        <div className="flex min-h-64 items-center justify-center" aria-live="polite">
          <LoaderCircle aria-label="Loading earnings" className="h-6 w-6 animate-spin text-red-400" />
        </div>
      ) : error ? (
        <Card className="mt-7 border-red-400/20 bg-red-400/[0.06]">
          <CardHeader>
            <CardTitle>We couldn’t load your earnings</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent><Button onClick={() => void loadEarnings()}>Try again</Button></CardContent>
        </Card>
      ) : earnings ? (
        <>
          <section className="mt-7 grid gap-4 sm:grid-cols-3" aria-label="Earnings totals">
            <EarningCard title="Today" amount={earnings.todayPaise} caption="Your payout so far" icon={<Coins aria-hidden="true" className="h-5 w-5" />} />
            <EarningCard title="This week" amount={earnings.thisWeekPaise} caption="Since Monday" icon={<Wallet aria-hidden="true" className="h-5 w-5" />} />
            <EarningCard title="All time" amount={earnings.allTimePaise} caption={`${earnings.tripCount} completed trips`} icon={<Coins aria-hidden="true" className="h-5 w-5" />} />
          </section>
          <Card className="mt-6 border-white/10 bg-[#111114]/90">
            <CardHeader>
              <CardTitle>Last seven days</CardTitle>
              <CardDescription>Daily payout totals for your completed and paid rides.</CardDescription>
            </CardHeader>
            <CardContent>
              <EarningsChart dailyPayouts={earnings.dailyPayouts} />
            </CardContent>
          </Card>
        </>
      ) : null}
    </main>
  );
}

export default function DriverEarningsPage() {
  return (
    <ProtectedRoute role="DRIVER">
      <EarningsContent />
    </ProtectedRoute>
  );
}
