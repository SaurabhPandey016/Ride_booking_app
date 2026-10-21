"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowDownUp,
  ArrowRight,
  Bike,
  CarFront,
  Check,
  Clock3,
  Crown,
  LoaderCircle,
  MapPin,
  Navigation,
  RotateCw,
  Route,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type KeyboardEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, normalizeApiError } from "@/lib/api";
import { useCurrency } from "@/hooks/use-currency";
import { formatPaise } from "@/lib/format";
import type { FareQuote, Place, RouteEstimate } from "@/types/maps";

const RideMap = dynamic(() => import("@/components/booking/ride-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[320px] items-center justify-center bg-zinc-900">
      <div className="flex items-center gap-3 text-sm text-zinc-400">
        <LoaderCircle aria-hidden="true" className="h-5 w-5 animate-spin text-red-400" />
        Loading map…
      </div>
    </div>
  ),
});

type BookingExperienceProps = {
  initialPickup: string;
  initialDrop: string;
};

type ApiResponse<T> = { data: T };
type SearchResponse = ApiResponse<{ results: Place[] }>;
type ReverseResponse = ApiResponse<{ place: Place }>;
type EstimateResponse = ApiResponse<{
  route: Omit<RouteEstimate, "geometry"> & { geometry: { coordinates: [number, number][] } };
  fares: FareQuote[];
}>;
type ActiveRideResponse = ApiResponse<{ ride: { id: string; status: string } | null }>;
type CreateRideResponse = ApiResponse<{ ride: { id: string } }>;

const readBestCurrentPosition = (
  geolocation: Geolocation,
): Promise<GeolocationPosition> =>
  new Promise((resolve, reject) => {
    let watchId: number | undefined;
    let bestPosition: GeolocationPosition | null = null;
    let settled = false;

    const finish = (position?: GeolocationPosition, error?: GeolocationPositionError) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      if (watchId !== undefined) geolocation.clearWatch(watchId);
      if (position) resolve(position);
      else reject(error ?? new Error("Your device did not return a location."));
    };

    const timer = window.setTimeout(
      () => finish(bestPosition ?? undefined),
      8000,
    );

    try {
      watchId = geolocation.watchPosition(
        (position) => {
          if (
            !bestPosition ||
            position.coords.accuracy < bestPosition.coords.accuracy
          ) {
            bestPosition = position;
          }

          if (position.coords.accuracy <= 25) {
            finish(position);
          }
        },
        (error) => finish(bestPosition ?? undefined, error),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 12000 },
      );
    } catch (error: unknown) {
      window.clearTimeout(timer);
      reject(error);
    }
  });

const vehicleOptions: Array<{
  type: FareQuote["vehicleType"];
  label: string;
  detail: string;
  icon: typeof Bike;
}> = [
  { type: "BIKE", label: "Bike", detail: "Quick solo trips", icon: Bike },
  { type: "AUTO", label: "Auto", detail: "Everyday comfort", icon: CarFront },
  { type: "CAB", label: "Cab", detail: "Room for the ride", icon: CarFront },
  { type: "PREMIUM", label: "Premium", detail: "Travel in style", icon: Crown },
];

export function BookingExperience({ initialPickup, initialDrop }: BookingExperienceProps) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const { currency } = useCurrency();
  const [pickup, setPickup] = useState<Place | null>(null);
  const [drop, setDrop] = useState<Place | null>(null);
  const [pickupQuery, setPickupQuery] = useState(
    initialPickup.trim().toLowerCase() === "current location" ? "" : initialPickup,
  );
  const [dropQuery, setDropQuery] = useState(initialDrop);
  const [mapTarget, setMapTarget] = useState<"pickup" | "drop">("pickup");
  const [route, setRoute] = useState<RouteEstimate | null>(null);
  const [fares, setFares] = useState<FareQuote[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<FareQuote["vehicleType"]>("BIKE");
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [estimateRetry, setEstimateRetry] = useState(0);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [reverseError, setReverseError] = useState<{
    lat: number;
    lng: number;
    target: "pickup" | "drop";
    message: string;
  } | null>(null);
  const [activeRide, setActiveRide] = useState<{ id: string; status: string } | null>(null);
  const [activeRideLoading, setActiveRideLoading] = useState(true);
  const [activeRideError, setActiveRideError] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rideSubmitting, setRideSubmitting] = useState(false);
  const [rideError, setRideError] = useState<string | null>(null);

  const selectedFare = useMemo(
    () => fares.find((fare) => fare.vehicleType === selectedVehicle) ?? null,
    [fares, selectedVehicle],
  );

  const loadActiveRide = useCallback(async () => {
    setActiveRideLoading(true);
    setActiveRideError(false);
    try {
      const response = await api.get<ActiveRideResponse>("/rides/active");
      setActiveRide(response.data.data.ride);
    } catch (error: unknown) {
      setActiveRideError(true);
      toast.error(normalizeApiError(error).message || "We couldn’t check your active ride.");
    } finally {
      setActiveRideLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadActiveRide();
  }, [loadActiveRide]);

  useEffect(() => {
    if (!pickup || !drop) {
      setRoute(null);
      setFares([]);
      setEstimateError(null);
      setEstimateLoading(false);
      return;
    }

    const controller = new AbortController();
    setEstimateLoading(true);
    setEstimateError(null);

    api
      .post<EstimateResponse>(
        "/rides/estimate",
        {
          pickup: { lat: pickup.lat, lng: pickup.lng },
          drop: { lat: drop.lat, lng: drop.lng },
        },
        { signal: controller.signal },
      )
      .then((response) => {
        setRoute({
          distanceKm: response.data.data.route.distanceKm,
          durationMin: response.data.data.route.durationMin,
          geometry: response.data.data.route.geometry.coordinates,
        });
        setFares(response.data.data.fares);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const message = normalizeApiError(error).message;
        setRoute(null);
        setFares([]);
        setEstimateError(message);
        toast.error(message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setEstimateLoading(false);
      });

    return () => controller.abort();
  }, [drop, estimateRetry, pickup]);

  const choosePlace = (target: "pickup" | "drop", place: Place) => {
    if (target === "pickup") {
      setLocationAccuracy(null);
      setPickup(place);
      setPickupQuery(place.label);
      setMapTarget("drop");
    } else {
      setDrop(place);
      setDropQuery(place.label);
    }
  };

  const editPlace = (target: "pickup" | "drop", query: string) => {
    if (target === "pickup") {
      setLocationAccuracy(null);
      setPickup(null);
      setPickupQuery(query);
      setMapTarget("pickup");
    } else {
      setDrop(null);
      setDropQuery(query);
      setMapTarget("drop");
    }
  };

  const swapLocations = () => {
    setLocationAccuracy(null);
    setPickup(drop);
    setDrop(pickup);
    setPickupQuery(drop?.label ?? dropQuery);
    setDropQuery(pickup?.label ?? pickupQuery);
  };

  const reverseGeocode = async (lat: number, lng: number, target: "pickup" | "drop") => {
    setReverseError(null);
    try {
      const response = await api.get<ReverseResponse>("/maps/reverse", {
        params: { lat, lng },
      });
      choosePlace(target, { ...response.data.data.place, lat, lng });
    } catch (error: unknown) {
      const message = normalizeApiError(error).message || "We couldn’t find an address for that spot.";
      setReverseError({ lat, lng, target, message });
      toast.error(message);
    }
  };

  const handleMapSelect = (lat: number, lng: number) => {
    void reverseGeocode(lat, lng, mapTarget);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Location services aren’t available in this browser.");
      return;
    }

    setLocationLoading(true);
    void readBestCurrentPosition(navigator.geolocation)
      .then(async ({ coords }) => {
        const response = await api.get<ReverseResponse>("/maps/reverse", {
          params: { lat: coords.latitude, lng: coords.longitude },
        });
        setReverseError(null);
        setPickup({
          ...response.data.data.place,
          lat: coords.latitude,
          lng: coords.longitude,
        });
        setPickupQuery(`Current location (near ${response.data.data.place.label})`);
        setMapTarget("drop");
        setLocationAccuracy(coords.accuracy);
        const accuracyMessage =
          coords.accuracy > 500
            ? `Your browser reports a broad location estimate (±${Math.round(coords.accuracy)} m). Laptop locations can be estimated from nearby Wi-Fi or your network. Drag the pickup pin or search Bela, Satna to correct it.`
            : `Pickup pin set from your device location (reported accuracy ±${Math.round(coords.accuracy)} m). The address is the nearest mapped address; drag the pin to fine-tune it.`;
        toast.info(accuracyMessage, { duration: 9000 });
      })
      .catch((error: unknown) => {
        const permissionDenied =
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === 1;
        toast.error(
          permissionDenied
            ? "Allow location access in your browser to use your current location."
            : normalizeApiError(error).message || "We couldn’t get your current location. Please try again.",
        );
      })
      .finally(() => setLocationLoading(false));
  };

  const requestRide = async () => {
    if (!pickup || !drop || !selectedFare) return;
    setRideSubmitting(true);
    setRideError(null);
    try {
      const response = await api.post<CreateRideResponse>("/rides", {
        pickup: { lat: pickup.lat, lng: pickup.lng },
        drop: { lat: drop.lat, lng: drop.lng },
        vehicleType: selectedVehicle,
      });
      toast.success("Your ride request has been sent.");
      router.push(`/ride/${encodeURIComponent(response.data.data.ride.id)}`);
    } catch (error: unknown) {
      const message = normalizeApiError(error).message;
      setRideError(message);
      toast.error(message);
      if (normalizeApiError(error).statusCode === 409) void loadActiveRide();
    } finally {
      setRideSubmitting(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-4.5rem)] bg-[#09090b]">
      <div className="flex flex-col lg:min-h-[calc(100vh-4.5rem)] lg:flex-row">
        <section className="order-2 relative z-10 -mt-5 w-full rounded-t-[1.6rem] border border-white/[0.07] bg-[#0d0d10] shadow-[0_-20px_70px_rgba(0,0,0,0.45)] lg:order-1 lg:sticky lg:top-[4.5rem] lg:mt-0 lg:h-[calc(100vh-4.5rem)] lg:w-[440px] lg:shrink-0 lg:overflow-y-auto lg:rounded-none lg:border-y-0 lg:border-l-0 lg:border-r lg:shadow-none xl:w-[480px]">
          <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-white/20 lg:hidden" />
          <div className="px-5 pb-8 pt-4 sm:px-7 sm:pt-6 lg:px-7 lg:pb-8 lg:pt-7">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-red-300">Your next trip</p>
                <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Where to?
                </h1>
                <p className="mt-1.5 text-sm text-zinc-500">Choose your pickup and destination.</p>
              </div>
              <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-500/15 bg-red-500/[0.07] text-red-300">
                <Navigation aria-hidden="true" className="h-5 w-5" />
              </div>
            </div>

            {activeRideLoading ? (
              <div className="mb-5 flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 py-3 text-xs text-zinc-400">
                <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin text-red-300" />
                Checking your active ride…
              </div>
            ) : activeRideError ? (
              <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-3 py-3 text-xs text-amber-100">
                <span>We couldn’t check for an active ride.</span>
                <button type="button" onClick={() => void loadActiveRide()} className="inline-flex shrink-0 items-center gap-1.5 font-semibold hover:text-white">
                  <RotateCw aria-hidden="true" className="h-3.5 w-3.5" /> Retry
                </button>
              </div>
            ) : activeRide ? (
              <Link
                href={`/ride/${encodeURIComponent(activeRide.id)}`}
                className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-4 py-3 transition hover:border-emerald-300/40 hover:bg-emerald-400/10"
              >
                <span>
                  <span className="block text-xs font-semibold text-emerald-200">You have an active ride</span>
                  <span className="mt-1 block text-[11px] text-emerald-100/60">Status: {formatStatus(activeRide.status)}</span>
                </span>
                <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-emerald-200" />
              </Link>
            ) : null}

            {reverseError && (
              <div className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.055] px-3.5 py-3">
                <div>
                  <p className="text-xs font-semibold text-red-100">We couldn’t find that address.</p>
                  <p className="mt-1 text-[11px] leading-4 text-red-100/60">{reverseError.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => void reverseGeocode(reverseError.lat, reverseError.lng, reverseError.target)}
                  className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-red-200 hover:text-white"
                >
                  <RotateCw aria-hidden="true" className="h-3.5 w-3.5" /> Retry
                </button>
              </div>
            )}

            <div className="relative space-y-3">
              <div aria-hidden="true" className="absolute left-[1.08rem] top-10 h-[calc(100%-5rem)] border-l border-dashed border-white/15" />
              <LocationField
                id="ride-pickup"
                label="Pickup"
                icon={<span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,.55)]" />}
                query={pickupQuery}
                selected={pickup}
                placeholder="Search pickup location"
                onQueryChange={(value) => editPlace("pickup", value)}
                onSelect={(place) => choosePlace("pickup", place)}
              />
              <button
                type="button"
                onClick={swapLocations}
                aria-label="Swap pickup and drop-off"
                className="absolute right-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg border border-white/10 bg-[#17171b] text-zinc-400 shadow-lg transition hover:border-red-400/30 hover:text-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                <ArrowDownUp aria-hidden="true" className="h-4 w-4" />
              </button>
              <LocationField
                id="ride-drop"
                label="Destination"
                icon={<MapPin aria-hidden="true" className="h-4 w-4 text-red-400" />}
                query={dropQuery}
                selected={drop}
                placeholder="Where are you going?"
                onQueryChange={(value) => editPlace("drop", value)}
                onSelect={(place) => choosePlace("drop", place)}
              />
            </div>

            {pickup && drop && (
              <section className="mt-6" aria-live="polite">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-white">Choose your ride</h2>
                  {estimateLoading && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-500">
                      <LoaderCircle aria-hidden="true" className="h-3.5 w-3.5 animate-spin" /> Updating fare
                    </span>
                  )}
                </div>

                {route && (
                  <div className="mb-4 flex items-center gap-4 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3.5 py-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10 text-red-300">
                      <Route aria-hidden="true" className="h-4 w-4" />
                    </div>
                    <div className="flex flex-1 items-center gap-4">
                      <div>
                        <p className="text-sm font-semibold text-white">{route.distanceKm.toFixed(1)} km</p>
                        <p className="text-[10px] text-zinc-500">Distance</p>
                      </div>
                      <span className="h-7 border-l border-white/10" />
                      <div>
                        <p className="flex items-center gap-1.5 text-sm font-semibold text-white">
                          <Clock3 aria-hidden="true" className="h-3.5 w-3.5 text-zinc-500" />
                          {route.durationMin} min
                        </p>
                        <p className="text-[10px] text-zinc-500">Estimated time</p>
                      </div>
                    </div>
                  </div>
                )}

                {estimateError ? (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/[0.055] p-4">
                    <p className="text-sm font-medium text-red-100">We couldn’t calculate this route.</p>
                    <p className="mt-1 text-xs leading-5 text-red-100/60">{estimateError}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 border-red-400/20 text-red-100 hover:bg-red-500/10"
                      onClick={() => setEstimateRetry((value) => value + 1)}
                    >
                      <RotateCw aria-hidden="true" className="h-3.5 w-3.5" /> Retry estimate
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5">
                    {vehicleOptions.map((vehicle) => {
                      const fare = fares.find((item) => item.vehicleType === vehicle.type);
                      const selected = selectedVehicle === vehicle.type;
                      const Icon = vehicle.icon;
                      return (
                        <button
                          key={vehicle.type}
                          type="button"
                          disabled={!fare || estimateLoading}
                          aria-pressed={selected}
                          onClick={() => setSelectedVehicle(vehicle.type)}
                          className={`relative min-h-[92px] rounded-xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-wait disabled:opacity-60 ${
                            selected
                              ? "border-red-500/70 bg-red-500/[0.08] shadow-[0_0_22px_rgba(239,68,68,.08)]"
                              : "border-white/[0.08] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.045]"
                          }`}
                        >
                          {selected && <Check aria-hidden="true" className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-red-300" />}
                          <Icon aria-hidden="true" className={`h-5 w-5 ${selected ? "text-red-300" : "text-zinc-400"}`} />
                          <span className="mt-2 block text-xs font-semibold text-white">{vehicle.label}</span>
                          <span className="mt-0.5 block text-[10px] text-zinc-500">{vehicle.detail}</span>
                          <span className="absolute bottom-3 right-3 text-xs font-bold text-white">
                            {fare ? formatPaise(fare.farePaise, currency) : <span className="inline-block h-3 w-12 animate-pulse rounded bg-white/10" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                <p className="mt-3 flex items-center gap-1.5 text-[10px] leading-4 text-zinc-600">
                  <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                  Fare is estimated upfront and verified again when you request.
                </p>
              </section>
            )}

            {rideError && (
              <div className="mt-4 flex items-start justify-between gap-3 rounded-xl border border-red-500/20 bg-red-500/[0.06] p-3 text-xs text-red-100">
                <span>{rideError}</span>
                <button type="button" aria-label="Dismiss error" onClick={() => setRideError(null)} className="text-red-200 hover:text-white">×</button>
              </div>
            )}

            <Button
              className="mt-5 h-12 w-full bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-sm font-semibold shadow-lg shadow-red-950/30 hover:from-red-400 hover:via-red-500 hover:to-red-600"
              disabled={!pickup || !drop || !selectedFare || estimateLoading || Boolean(estimateError) || Boolean(activeRide) || rideSubmitting}
              onClick={() => setConfirmOpen(true)}
            >
              {rideSubmitting ? (
                <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Request ride
                  {selectedFare && <span className="ml-auto">{formatPaise(selectedFare.farePaise, currency)}</span>}
                  <ArrowRight aria-hidden="true" className="ml-1 h-4 w-4" />
                </>
              )}
            </Button>
            {!pickup || !drop ? (
              <p className="mt-2 text-center text-[11px] text-zinc-600">Choose locations from search or click directly on the map.</p>
            ) : null}

            <AnimatePresence>
              {estimateLoading && !route && !estimateError && (
                <motion.div
                  initial={reducedMotion ? false : { opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 flex items-center justify-center gap-2 text-xs text-zinc-500"
                >
                  <Sparkles aria-hidden="true" className="h-3.5 w-3.5 text-red-300" />
                  Finding the best route and fare…
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        <section className="order-1 relative h-[42vh] min-h-[320px] overflow-hidden bg-zinc-900 lg:order-2 lg:sticky lg:top-[4.5rem] lg:h-[calc(100vh-4.5rem)] lg:min-h-[520px] lg:flex-1">
          <RideMap
            pickup={pickup}
            drop={drop}
            geometry={route?.geometry ?? null}
            target={mapTarget}
            onTargetChange={setMapTarget}
            onMapSelect={handleMapSelect}
            onUseMyLocation={useMyLocation}
            locationLoading={locationLoading}
            locationAccuracy={locationAccuracy}
            onPickupMove={(lat, lng) => void reverseGeocode(lat, lng, "pickup")}
          />
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-[400] h-16 bg-gradient-to-t from-black/20 to-transparent" />
        </section>
      </div>

      <Dialog open={confirmOpen} onOpenChange={(open) => !rideSubmitting && setConfirmOpen(open)}>
        <DialogContent className="border-white/10 bg-[#111114] sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Confirm your ride</DialogTitle>
            <DialogDescription>Review your trip details before we find a driver.</DialogDescription>
          </DialogHeader>
          {pickup && drop && selectedFare && (
            <div className="space-y-4">
              <div className="rounded-xl border border-white/[0.08] bg-black/20 p-4">
                <TripPoint icon="pickup" title="Pickup" label={pickup.label} />
                <div className="ml-[7px] my-2 h-5 border-l border-dashed border-white/15" />
                <TripPoint icon="drop" title="Destination" label={drop.label} />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-black/20 p-4">
                <div>
                  <p className="text-sm font-semibold text-white">{vehicleOptions.find((item) => item.type === selectedVehicle)?.label}</p>
                  <p className="mt-1 text-xs text-zinc-500">{route?.distanceKm.toFixed(1)} km · about {route?.durationMin} min</p>
                </div>
                <p className="text-lg font-bold text-white">{formatPaise(selectedFare.farePaise, currency)}</p>
              </div>
              <Button
                className="h-11 w-full bg-gradient-to-r from-red-500 to-red-700"
                disabled={rideSubmitting}
                onClick={() => void requestRide()}
              >
                {rideSubmitting ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : "Confirm and request ride"}
              </Button>
              {rideError && (
                <div role="alert" className="flex items-center justify-between gap-3 text-xs text-red-300">
                  <span>{rideError}</span>
                  <button
                    type="button"
                    disabled={rideSubmitting}
                    onClick={() => void requestRide()}
                    className="inline-flex shrink-0 items-center gap-1.5 font-semibold text-red-200 hover:text-white disabled:opacity-60"
                  >
                    <RotateCw aria-hidden="true" className="h-3.5 w-3.5" /> Retry request
                  </button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}

function formatStatus(status: string): string {
  return status.toLowerCase().replaceAll("_", " ");
}

function TripPoint({ icon, title, label }: { icon: "pickup" | "drop"; title: string; label: string }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${icon === "pickup" ? "bg-emerald-400" : "bg-red-400"}`} />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-zinc-500">{title}</p>
        <p className="mt-0.5 line-clamp-2 text-sm text-zinc-200">{label}</p>
      </div>
    </div>
  );
}

function LocationField({
  id,
  label,
  icon,
  query,
  selected,
  placeholder,
  onQueryChange,
  onSelect,
}: {
  id: string;
  label: string;
  icon: ReactNode;
  query: string;
  selected: Place | null;
  placeholder: string;
  onQueryChange: (value: string) => void;
  onSelect: (place: Place) => void;
}) {
  const [results, setResults] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [retry, setRetry] = useState(0);

  const runSearch = useCallback(async (searchText: string, signal: AbortSignal) => {
    setLoading(true);
    setSearchError(null);
    try {
      const response = await api.get<SearchResponse>("/maps/search", {
        params: { q: searchText },
        signal,
      });
      setResults(response.data.data.results);
      setHasSearched(true);
      setOpen(true);
      setHighlightedIndex(-1);
    } catch (error: unknown) {
      if (signal.aborted) return;
      const message = normalizeApiError(error).message;
      setResults([]);
      setHasSearched(true);
      setOpen(true);
      setSearchError(message);
      toast.error(message);
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selected || query.trim().length < 3) {
      setResults([]);
      setSearchError(null);
      setHasSearched(false);
      setOpen(false);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void runSearch(query.trim(), controller.signal);
    }, 400);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, retry, runSearch, selected]);

  const choose = (place: Place) => {
    onSelect(place);
    setOpen(false);
    setResults([]);
    setHighlightedIndex(-1);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && results.length) {
      event.preventDefault();
      setOpen(true);
      setHighlightedIndex((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp" && results.length) {
      event.preventDefault();
      setHighlightedIndex((index) => (index <= 0 ? results.length - 1 : index - 1));
    } else if (event.key === "Enter" && highlightedIndex >= 0 && results[highlightedIndex]) {
      event.preventDefault();
      choose(results[highlightedIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  const listId = `${id}-suggestions`;

  return (
    <div className={`relative ${open && !selected ? "z-30" : "z-10"}`}>
      <Label htmlFor={id} className="mb-1.5 ml-1 block text-[11px] font-medium text-zinc-500">{label}</Label>
      <div className={`relative rounded-xl border bg-[#151519] transition-colors focus-within:border-red-400/50 ${selected ? "border-white/10" : "border-white/[0.08]"}`}>
        <span className="absolute left-3.5 top-1/2 z-10 flex h-5 w-5 -translate-y-1/2 items-center justify-center">{icon}</span>
        <Input
          id={id}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open && !selected}
          aria-controls={listId}
          aria-activedescendant={highlightedIndex >= 0 ? `${listId}-option-${highlightedIndex}` : undefined}
          autoComplete="off"
          value={query}
          onChange={(event) => {
            onQueryChange(event.target.value);
            setOpen(event.target.value.trim().length >= 3);
            setSearchError(null);
            setHasSearched(false);
          }}
          onFocus={() => {
            if (!selected && (results.length || searchError)) setOpen(true);
          }}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="h-12 border-0 bg-transparent pl-11 pr-10 text-sm shadow-none placeholder:text-zinc-600 focus-visible:ring-0"
        />
        {loading && (
          <LoaderCircle aria-label="Searching locations" className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-red-300" />
        )}
        {selected && (
          <Check aria-label="Location selected" className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-400" />
        )}
        {open && !selected && query.trim().length >= 3 && (
          <div
            id={listId}
            role="listbox"
            aria-label={`${label} suggestions`}
            className="absolute left-0 right-0 top-[calc(100%+8px)] z-[600] max-h-60 overflow-y-auto rounded-xl border border-white/10 bg-[#151519] p-1.5 shadow-[0_18px_45px_rgba(0,0,0,.6)]"
          >
            {searchError ? (
              <div className="p-3">
                <p className="text-xs leading-5 text-red-200">{searchError}</p>
                <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => setRetry((value) => value + 1)} className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-red-300 hover:text-red-200">
                  <RotateCw aria-hidden="true" className="h-3.5 w-3.5" /> Retry search
                </button>
              </div>
            ) : results.length ? (
              results.map((place, index) => (
                <button
                  key={`${place.lat}:${place.lng}:${place.label}`}
                  id={`${listId}-option-${index}`}
                  type="button"
                  role="option"
                  aria-selected={highlightedIndex === index}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => choose(place)}
                  className={`flex min-h-12 w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition ${highlightedIndex === index ? "bg-red-500/10" : "hover:bg-white/[0.04]"}`}
                >
                  <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
                  <span className="line-clamp-2 text-xs leading-5 text-zinc-200">{place.label}</span>
                </button>
              ))
            ) : (
              <p className="p-3 text-xs text-zinc-500">{loading || !hasSearched ? "Searching nearby places…" : "No places found. Try a nearby landmark or city."}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
