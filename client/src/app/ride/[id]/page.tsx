"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertCircle, ArrowLeft, Check, Clock3, LoaderCircle, MapPin, RotateCw, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProtectedRoute } from "@/components/shared/protected-route";
import { api, normalizeApiError } from "@/lib/api";
import { formatPaise } from "@/lib/format";
import { useCurrency } from "@/hooks/use-currency";
import { useAuthStore } from "@/store/auth-store";

type RideDetails = {
  id: string;
  status: string;
  vehicleType: "BIKE" | "AUTO" | "CAB" | "PREMIUM";
  pickupAddress: string;
  dropAddress: string;
  distanceKm: number;
  durationMin: number;
  farePaise: number;
  requestedAt: string;
};

type RideResponse = { data: { ride: RideDetails } };

const vehicleNames: Record<RideDetails["vehicleType"], string> = {
  BIKE: "Bike",
  AUTO: "Auto",
  CAB: "Cab",
  PREMIUM: "Premium",
};

function RideRequestDetails({ rideId }: { rideId: string }) {
  const { currency } = useCurrency();
  const user = useAuthStore((state) => state.user);
  const [ride, setRide] = useState<RideDetails | null>(null);
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
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoaderCircle aria-label="Loading ride" className="h-6 w-6 animate-spin text-red-400" />
      </div>
    );
  }

  if (error || !ride) {
    return (
      <main className="mx-auto flex min-h-[65vh] max-w-xl items-center px-5 py-12">
        <Card className="w-full border-white/10 bg-card/90">
          <CardHeader>
            <AlertCircle aria-hidden="true" className="mb-2 h-7 w-7 text-red-300" />
            <CardTitle>We couldn’t load this ride</CardTitle>
            <CardDescription>{error ?? "This ride could not be found."}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => void loadRide()}>
              <RotateCw aria-hidden="true" className="h-4 w-4" /> Try again
            </Button>
            <Button asChild><Link href="/book">Back to booking</Link></Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-[70vh] max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <Link href="/book" className="mb-7 inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white">
        <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Back to booking
      </Link>
      <Card className="overflow-hidden border-white/10 bg-card/90 shadow-glow">
        <div className="h-1.5 bg-gradient-to-r from-red-500 via-red-600 to-red-900" />
        <CardHeader className="p-6 sm:p-8">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
            <Check aria-hidden="true" className="h-6 w-6" />
          </span>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-300">
            {user?.role === "DRIVER" ? "Driver workspace" : "Ride requested"}
          </p>
          <CardTitle className="mt-2 text-3xl">
          {user?.role === "DRIVER" ? "Ride accepted. You’re on your way." : "We’re finding your driver."}
          </CardTitle>
          <CardDescription>
            Your request is in. We’ll keep this ride status up to date as it progresses.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 px-6 pb-7 sm:px-8 sm:pb-9">
          <div className="grid gap-3 rounded-xl border border-white/[0.08] bg-black/20 p-4 sm:grid-cols-3">
            <Summary label="Ride status" value={ride.status.toLowerCase().replaceAll("_", " ")} icon={<Clock3 aria-hidden="true" className="h-4 w-4" />} />
            <Summary label="Ride type" value={vehicleNames[ride.vehicleType]} icon={<Route aria-hidden="true" className="h-4 w-4" />} />
            <Summary label="Estimated total" value={formatPaise(ride.farePaise, currency)} icon={<Check aria-hidden="true" className="h-4 w-4" />} />
          </div>
          <div className="space-y-4 rounded-xl border border-white/[0.08] bg-black/20 p-4">
            <AddressPoint label="Pickup" address={ride.pickupAddress} color="emerald" />
            <div className="ml-[7px] h-5 border-l border-dashed border-white/15" />
            <AddressPoint label="Destination" address={ride.dropAddress} color="red" />
          </div>
          <p className="text-xs text-zinc-500">
            {ride.distanceKm.toFixed(1)} km · around {ride.durationMin} minutes · Request ID {ride.id}
          </p>
          <div className="flex flex-wrap gap-3">
            {user?.role === "DRIVER" ? (
              <Button asChild className="gradient-red text-white hover:brightness-110">
                <Link href="/driver">Back to driver dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild className="gradient-red text-white hover:brightness-110">
                  <Link href="/history">View ride history</Link>
                </Button>
                <Button asChild variant="outline"><Link href="/book">Book another ride</Link></Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

function Summary({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="flex items-center gap-3 sm:flex-col sm:items-start">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.045] text-red-300">{icon}</span>
      <div>
        <p className="text-[11px] text-zinc-500">{label}</p>
        <p className="mt-0.5 capitalize text-sm font-semibold text-white">{value}</p>
      </div>
    </div>
  );
}

function AddressPoint({ label, address, color }: { label: string; address: string; color: "emerald" | "red" }) {
  const colorClasses =
    color === "emerald"
      ? { wrapper: "bg-emerald-400/15", dot: "bg-emerald-400" }
      : { wrapper: "bg-red-400/15", dot: "bg-red-400" };

  return (
    <div className="flex items-start gap-3">
      <span className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${colorClasses.wrapper}`}>
        <span className={`h-2 w-2 rounded-full ${colorClasses.dot}`} />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</p>
        <p className="mt-1 flex items-start gap-1.5 text-sm leading-5 text-zinc-200">
          <MapPin aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-500" />
          <span>{address}</span>
        </p>
      </div>
    </div>
  );
}

export default function RideDetailsPage() {
  const params = useParams<{ id: string }>();
  return (
    <ProtectedRoute>
      <RideRequestDetails rideId={params.id} />
    </ProtectedRoute>
  );
}
