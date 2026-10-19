"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Bike, CarFront, Clock3, MapPin, ReceiptText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProtectedRoute } from "@/components/shared/protected-route";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { api, normalizeApiError } from "@/lib/api";
import { formatDateTime, formatPaise } from "@/lib/format";
import { useCurrency } from "@/hooks/use-currency";

type Ride = {
  id: string;
  status: string;
  vehicleType: "BIKE" | "AUTO" | "CAB" | "PREMIUM";
  pickupAddress: string;
  dropAddress: string;
  distanceKm: number;
  durationMin: number;
  farePaise: number;
  requestedAt: string;
  payment: { status: string; receiptNumber: string | null } | null;
  review: { rating: number; comment: string | null } | null;
};
type RideResponse = { data: { ride: Ride } };

function HistoryRideContent({ rideId }: { rideId: string }) {
  const { currency } = useCurrency();
  const [ride, setRide] = useState<Ride | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadRide = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<RideResponse>(`/rides/${encodeURIComponent(rideId)}`);
      setRide(response.data.data.ride);
    } catch (requestError: unknown) {
      setError(normalizeApiError(requestError).message);
    } finally {
      setLoading(false);
    }
  }, [rideId]);

  useEffect(() => {
    void loadRide();
  }, [loadRide]);

  if (loading) {
    return <PageSkeleton cards={1} />;
  }
  if (error || !ride) {
    return (
      <main className="mx-auto max-w-xl px-5 py-12">
        <Card className="border-white/10 bg-[#111114]">
          <CardHeader><CardTitle>Trip unavailable</CardTitle><CardDescription>{error}</CardDescription></CardHeader>
          <CardContent className="flex gap-3">
            <Button variant="outline" onClick={() => void loadRide()}>Try again</Button>
            <Button asChild><Link href="/history">Ride history</Link></Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const VehicleIcon = ride.vehicleType === "BIKE" ? Bike : CarFront;
  return (
    <main className="mx-auto min-h-[65vh] max-w-3xl px-4 pb-16 pt-8 sm:px-6">
      <Button asChild variant="ghost" className="mb-5 text-zinc-400 hover:text-white">
        <Link href="/history"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Ride history</Link>
      </Button>
      <Card className="overflow-hidden border-white/10 bg-[#111114]/90">
        <div className="h-1.5 bg-gradient-to-r from-red-500 to-red-900" />
        <CardHeader className="flex-row items-start justify-between gap-4 p-5 sm:p-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-300">Trip details</p>
            <CardTitle className="mt-2 text-2xl">Your RideX journey</CardTitle>
            <CardDescription className="mt-2 flex items-center gap-1.5"><Clock3 aria-hidden="true" className="h-3.5 w-3.5" />{formatDateTime(ride.requestedAt)}</CardDescription>
          </div>
          <Badge variant="outline" className="border-white/10 text-zinc-200">{ride.status.replaceAll("_", " ")}</Badge>
        </CardHeader>
        <CardContent className="space-y-5 px-5 pb-6 sm:px-7">
          <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-black/20 p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-400/10 text-red-300"><VehicleIcon aria-hidden="true" className="h-5 w-5" /></span>
            <div><p className="font-semibold text-white">{ride.vehicleType}</p><p className="mt-1 text-xs text-zinc-500">{ride.distanceKm.toFixed(1)} km · {ride.durationMin} min · {formatPaise(ride.farePaise, currency)}</p></div>
          </div>
          <TripAddress label="Pickup" address={ride.pickupAddress} />
          <TripAddress label="Drop-off" address={ride.dropAddress} />
          {ride.review && (
            <div className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Your review</p>
              <p className="mt-2 text-amber-300">{"★".repeat(ride.review.rating)}{"☆".repeat(5 - ride.review.rating)}</p>
              {ride.review.comment && <p className="mt-2 text-sm text-zinc-300">{ride.review.comment}</p>}
            </div>
          )}
          <div className="flex flex-wrap gap-3 border-t border-white/[0.08] pt-5">
            <Button asChild className="gradient-red text-white">
              <Link href={`/ride/${encodeURIComponent(ride.id)}`}>Live ride details<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
            </Button>
            {ride.payment && (
              <Button asChild variant="outline" className="border-white/10">
                <Link href={`/receipt/${encodeURIComponent(ride.id)}`}><ReceiptText aria-hidden="true" className="h-4 w-4" />View receipt</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

function TripAddress({ label, address }: { label: string; address: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/[0.07] bg-black/20 p-4">
      <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
      <div><p className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</p><p className="mt-1 text-sm leading-5 text-zinc-200">{address}</p></div>
    </div>
  );
}

export default function HistoryRidePage() {
  const params = useParams<{ id: string }>();
  return <ProtectedRoute><HistoryRideContent rideId={params.id} /></ProtectedRoute>;
}
