"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import {
  AlertCircle,
  ArrowRight,
  Bike,
  CarFront,
  Check,
  Clock3,
  History,
  LoaderCircle,
  MapPin,
  RefreshCw,
  Route,
  Star,
  Wallet,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrency } from "@/hooks/use-currency";
import { api, normalizeApiError } from "@/lib/api";
import { formatDateTime, formatPaise } from "@/lib/format";

type RideStatus = "REQUESTED" | "ACCEPTED" | "ARRIVED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
type RideHistoryItem = {
  id: string;
  status: RideStatus;
  vehicleType: "BIKE" | "AUTO" | "CAB" | "PREMIUM";
  pickupAddress: string;
  dropAddress: string;
  distanceKm: number;
  durationMin: number;
  farePaise: number;
  requestedAt: string;
  payment: {
    receiptNumber: string;
    currency: "INR" | "USD";
    amountMinor: number;
    status: "PENDING" | "SUCCEEDED" | "FAILED";
    paidAt: string | null;
  } | null;
  review: { rating: number; comment: string | null; createdAt: string } | null;
};
type ApiResponse<T> = { data: T };
type RideHistoryResponse = ApiResponse<{
  rides: RideHistoryItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}>;
type FilterTab = "all" | "COMPLETED" | "CANCELLED";

const vehicleLabels: Record<RideHistoryItem["vehicleType"], string> = {
  BIKE: "Bike",
  AUTO: "Auto",
  CAB: "Cab",
  PREMIUM: "Premium",
};

function statusBadge(status: RideStatus) {
  const styles: Record<RideStatus, string> = {
    REQUESTED: "border-sky-400/20 bg-sky-400/10 text-sky-200",
    ACCEPTED: "border-blue-400/20 bg-blue-400/10 text-blue-200",
    ARRIVED: "border-violet-400/20 bg-violet-400/10 text-violet-200",
    IN_PROGRESS: "border-amber-400/20 bg-amber-400/10 text-amber-200",
    COMPLETED: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
    CANCELLED: "border-red-400/20 bg-red-400/10 text-red-200",
  };
  return (
    <Badge variant="outline" className={styles[status]}>
      {status.replaceAll("_", " ").toLowerCase().replace(/^\w/, (char) => char.toUpperCase())}
    </Badge>
  );
}

function RideCard({ ride, isDriver }: { ride: RideHistoryItem; isDriver: boolean }) {
  const { currency } = useCurrency();
  const VehicleIcon = ride.vehicleType === "BIKE" ? Bike : CarFront;
  const payout = Math.floor((ride.farePaise * 85) / 100);

  return (
    <Card className="overflow-hidden border-white/10 bg-[#111114]/90 transition hover:border-red-400/25">
      <CardContent className="p-0">
        <div className="flex flex-col gap-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-400/15 bg-red-400/10 text-red-300">
                <VehicleIcon aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold text-white">{vehicleLabels[ride.vehicleType]} ride</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
                  <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />
                  {formatDateTime(ride.requestedAt)}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {statusBadge(ride.status)}
              {ride.payment ? (
                <Badge
                  variant="outline"
                  className={ride.payment.status === "SUCCEEDED"
                    ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                    : ride.payment.status === "FAILED"
                      ? "border-red-400/20 bg-red-400/10 text-red-200"
                      : "border-amber-400/20 bg-amber-400/10 text-amber-200"}
                >
                  {ride.payment.status === "SUCCEEDED" ? <Check aria-hidden="true" className="mr-1 h-3 w-3" /> : null}
                  {ride.payment.status.toLowerCase()}
                </Badge>
              ) : (
                <Badge variant="outline" className="border-white/10 text-zinc-500">Unpaid</Badge>
              )}
            </div>
          </div>

          <div className="grid gap-3 rounded-xl border border-white/[0.07] bg-black/20 p-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
            <HistoryAddress label="Pickup" address={ride.pickupAddress} />
            <ArrowRight aria-hidden="true" className="hidden h-4 w-4 text-zinc-600 sm:block" />
            <HistoryAddress label="Drop-off" address={ride.dropAddress} />
          </div>

          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-500">
              <span className="inline-flex items-center gap-1.5"><Route aria-hidden="true" className="h-3.5 w-3.5" />{ride.distanceKm.toFixed(1)} km · {ride.durationMin} min</span>
              {ride.review && (
                <span className="inline-flex items-center gap-1 text-amber-300" aria-label={`Rated ${ride.review.rating} out of 5`}>
                  <Star aria-hidden="true" className="h-3.5 w-3.5 fill-current" />{ride.review.rating}/5
                </span>
              )}
            </div>
            <div className="flex items-end gap-4">
              {isDriver && ride.status === "COMPLETED" && ride.payment?.status === "SUCCEEDED" && (
                <div className="text-right">
                  <p className="text-[10px] text-zinc-500">Your payout (85%)</p>
                  <p className="text-sm font-semibold text-emerald-300">{formatPaise(payout, currency)}</p>
                </div>
              )}
              <div className="text-right">
                <p className="text-[10px] text-zinc-500">Fare</p>
                <p className="font-display text-lg font-bold text-white">{formatPaise(ride.farePaise, currency)}</p>
              </div>
              <Button asChild size="sm" variant="outline" className="border-white/10">
                <Link href={`/history/${encodeURIComponent(ride.id)}`}>Details<ArrowRight aria-hidden="true" className="h-3.5 w-3.5" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function HistoryAddress({ label, address }: { label: string; address: string }) {
  return (
    <div className="flex min-w-0 items-start gap-2">
      <MapPin aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-300" />
      <div className="min-w-0">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
        <p className="mt-0.5 line-clamp-1 text-xs text-zinc-200">{address}</p>
      </div>
    </div>
  );
}

function RideSkeleton() {
  return (
    <Card aria-hidden="true" className="border-white/10 bg-[#111114]/90">
      <CardContent className="animate-pulse space-y-4 p-5">
        <div className="flex justify-between">
          <div className="h-10 w-40 rounded-lg bg-white/[0.06]" />
          <div className="h-7 w-24 rounded-full bg-white/[0.06]" />
        </div>
        <div className="h-16 rounded-xl bg-white/[0.04]" />
        <div className="h-7 w-36 rounded-lg bg-white/[0.06]" />
      </CardContent>
    </Card>
  );
}

export function RideHistory() {
  const user = useAuthStore((state) => state.user);
  const isDriver = user?.role === "DRIVER";
  const [tab, setTab] = useState<FilterTab>("all");
  const [rides, setRides] = useState<RideHistoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const loadHistory = useCallback(async (pageNumber: number, status: FilterTab, append: boolean) => {
    if (append) setLoadingMore(true);
    else {
      setLoading(true);
      setRides([]);
    }
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(pageNumber), limit: "10" });
      if (status !== "all") params.set("status", status);
      const response = await api.get<RideHistoryResponse>(`/rides/history?${params.toString()}`);
      const result = response.data.data;
      setRides((current) => append ? [...current, ...result.rides] : result.rides);
      setPage(result.pagination.page);
      setTotalPages(result.pagination.totalPages);
    } catch (requestError: unknown) {
      setError(normalizeApiError(requestError).message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory(1, tab, false);
  }, [loadHistory, retryCount, tab]);

  const changeTab = (value: string) => {
    if (value === "all" || value === "COMPLETED" || value === "CANCELLED") {
      setTab(value);
    }
  };

  return (
    <main className="mx-auto min-h-[65vh] max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-300">Your journeys</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-white sm:text-4xl">Ride history</h1>
          <p className="mt-2 text-sm text-zinc-400">
            {isDriver ? "Your completed trips and driver payouts." : "Every trip, payment and review in one place."}
          </p>
        </div>
        <Button asChild className="gradient-red self-start text-white sm:self-auto">
          <Link href={isDriver ? "/driver" : "/book"}>{isDriver ? "Driver dashboard" : "Book a ride"}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
        </Button>
      </div>

      <Tabs value={tab} onValueChange={changeTab} className="mt-7">
        <TabsList className="h-auto w-full justify-start gap-1 rounded-xl border border-white/[0.07] bg-[#111114] p-1 sm:w-auto">
          <TabsTrigger value="all" className="min-w-20">All</TabsTrigger>
          <TabsTrigger value="COMPLETED" className="min-w-28">Completed</TabsTrigger>
          <TabsTrigger value="CANCELLED" className="min-w-24">Cancelled</TabsTrigger>
        </TabsList>
      </Tabs>

      <section className="mt-5 space-y-3" aria-label="Ride history results" aria-live="polite">
        {loading ? (
          Array.from({ length: 3 }, (_, index) => <RideSkeleton key={index} />)
        ) : error ? (
          <Card className="border-red-400/20 bg-red-400/[0.05]">
            <CardContent className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-start gap-2 text-sm text-red-200"><AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />{error}</p>
              <Button variant="outline" onClick={() => setRetryCount((count) => count + 1)}><RefreshCw aria-hidden="true" className="h-4 w-4" />Try again</Button>
            </CardContent>
          </Card>
        ) : rides.length === 0 ? (
          <Card className="border-white/10 bg-[#111114]/80">
            <CardContent className="flex flex-col items-center px-5 py-12 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-zinc-400">
                {tab === "CANCELLED" ? <X aria-hidden="true" className="h-6 w-6" /> : <History aria-hidden="true" className="h-6 w-6" />}
              </span>
              <h2 className="mt-4 font-display text-lg font-semibold text-white">
                {tab === "all" ? "Your rides will show up here" : `No ${tab.toLowerCase()} rides yet`}
              </h2>
              <p className="mt-2 max-w-sm text-sm text-zinc-500">
                {tab === "all" ? "Take your first RideX journey and you’ll find trip details and receipts here." : "Try another filter or check back after your next trip."}
              </p>
              {tab === "all" && (
                <Button asChild className="gradient-red mt-5 text-white">
                  <Link href={isDriver ? "/driver" : "/book"}>{isDriver ? "Go online" : "Book your first ride"}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          rides.map((ride) => <RideCard key={ride.id} ride={ride} isDriver={Boolean(isDriver)} />)
        )}
        {!loading && !error && rides.length > 0 && page < totalPages && (
          <div className="flex justify-center pt-3">
            <Button
              variant="outline"
              className="min-w-36 border-white/10"
              disabled={loadingMore}
              onClick={() => void loadHistory(page + 1, tab, true)}
            >
              {loadingMore ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Wallet aria-hidden="true" className="h-4 w-4" />}
              Load more
            </Button>
          </div>
        )}
      </section>
    </main>
  );
}
