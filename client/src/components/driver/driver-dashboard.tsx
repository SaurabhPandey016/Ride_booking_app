"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowDown,
  ArrowUpRight,
  Bike,
  CarFront,
  Check,
  Clock3,
  Coins,
  LoaderCircle,
  MapPin,
  Navigation,
  RefreshCw,
  Route,
  Signal,
  SignalZero,
  Star,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurrency } from "@/hooks/use-currency";
import { api, normalizeApiError } from "@/lib/api";
import { formatPaise } from "@/lib/format";
import { getRideSocket } from "@/lib/socket";
import { useAuthStore } from "@/store/auth-store";

type ApiResponse<T> = { data: T };
type VehicleType = "BIKE" | "AUTO" | "CAB" | "PREMIUM";
type RideRequest = {
  id: string;
  riderId: string;
  driverId: string | null;
  status: string;
  vehicleType: VehicleType;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropAddress: string;
  dropLat: number;
  dropLng: number;
  distanceKm: number;
  durationMin: number;
  farePaise: number;
  routeGeometry: unknown;
  requestedAt?: string;
  receivedAt: number;
};
type DailyPayout = { date: string; amountPaise: number };
export type DriverEarningsData = {
  todayPaise: number;
  thisWeekPaise: number;
  allTimePaise: number;
  tripCount: number;
  dailyPayouts: DailyPayout[];
};
type DriverProfile = {
  isOnline: boolean;
  currentLat: number | null;
  currentLng: number | null;
  ratingAvg: number;
  ratingCount: number;
  vehicleType: VehicleType;
  vehicleModel: string;
  vehicleNumber: string;
};
type DashboardUser = {
  id: string;
  name: string;
  driverProfile: DriverProfile | null;
};

const vehicleNames: Record<VehicleType, string> = {
  BIKE: "Bike",
  AUTO: "Auto",
  CAB: "Cab",
  PREMIUM: "Premium",
};

const vehicleIcons: Record<VehicleType, typeof Bike> = {
  BIKE: Bike,
  AUTO: CarFront,
  CAB: CarFront,
  PREMIUM: CarFront,
};

const isRideRequest = (value: unknown): value is Omit<RideRequest, "receivedAt"> => {
  if (typeof value !== "object" || value === null) return false;
  const ride = value as Partial<RideRequest>;
  return (
    typeof ride.id === "string" &&
    typeof ride.pickupAddress === "string" &&
    typeof ride.dropAddress === "string" &&
    typeof ride.farePaise === "number" &&
    typeof ride.distanceKm === "number" &&
    typeof ride.durationMin === "number" &&
    (ride.vehicleType === "BIKE" ||
      ride.vehicleType === "AUTO" ||
      ride.vehicleType === "CAB" ||
      ride.vehicleType === "PREMIUM")
  );
};

const requestWithTimestamp = (ride: Omit<RideRequest, "receivedAt"> | RideRequest): RideRequest => ({
  ...ride,
  receivedAt: "receivedAt" in ride
    ? ride.receivedAt
    : ride.requestedAt
      ? new Date(ride.requestedAt).getTime()
      : Date.now(),
});

const getRoutePoints = (geometry: unknown): [number, number][] => {
  if (typeof geometry !== "object" || geometry === null || !("coordinates" in geometry)) {
    return [];
  }
  const coordinates = geometry.coordinates;
  if (!Array.isArray(coordinates)) return [];
  return coordinates.filter(
    (point): point is [number, number] =>
      Array.isArray(point) &&
      point.length >= 2 &&
      typeof point[0] === "number" &&
      typeof point[1] === "number",
  );
};

export function EarningsChart({ dailyPayouts }: { dailyPayouts: DailyPayout[] }) {
  const { currency } = useCurrency();
  const max = Math.max(...dailyPayouts.map((day) => day.amountPaise), 1);
  const width = 520;
  const chartHeight = 150;
  const barWidth = 34;
  const gap = (width - dailyPayouts.length * barWidth) / (dailyPayouts.length + 1);

  return (
    <div className="overflow-x-auto">
      <svg
        className="h-52 min-w-[420px] w-full"
        viewBox={`0 0 ${width} ${chartHeight + 40}`}
        role="img"
        aria-label="Driver payout totals for the last seven days"
      >
        <line x1="0" y1={chartHeight} x2={width} y2={chartHeight} stroke="rgba(255,255,255,.1)" />
        {dailyPayouts.map((day, index) => {
          const barHeight = Math.max((day.amountPaise / max) * 112, day.amountPaise ? 5 : 2);
          const x = gap + index * (barWidth + gap);
          const date = new Date(`${day.date}T12:00:00`);
          return (
            <g key={day.date}>
              <title>{`${date.toLocaleDateString("en-IN", { weekday: "long" })}: ${formatPaise(day.amountPaise, currency)}`}</title>
              <rect
                x={x}
                y={chartHeight - barHeight}
                width={barWidth}
                height={barHeight}
                rx="8"
                fill="url(#payoutGradient)"
                className="transition-all duration-500"
              />
              <text x={x + barWidth / 2} y={chartHeight + 23} textAnchor="middle" fill="#a1a1aa" fontSize="11">
                {date.toLocaleDateString("en-IN", { weekday: "short" })}
              </text>
            </g>
          );
        })}
        <defs>
          <linearGradient id="payoutGradient" x1="0" x2="0" y1="0" y2="1">
            <stop stopColor="#fb5555" />
            <stop offset="1" stopColor="#991b1b" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function RequestCard({
  ride,
  busy,
  onAccept,
  onDecline,
}: {
  ride: RideRequest;
  busy: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const { currency } = useCurrency();
  const [now, setNow] = useState(Date.now());
  const Icon = vehicleIcons[ride.vehicleType];
  const elapsedSeconds = Math.max(0, Math.floor((now - ride.receivedAt) / 1000));
  const secondsLeft = Math.max(0, 30 - elapsedSeconds);
  const progress = secondsLeft / 30;
  const radius = 15;
  const circumference = 2 * Math.PI * radius;
  const routePoints = useMemo(() => getRoutePoints(ride.routeGeometry), [ride.routeGeometry]);
  const previewPoints = useMemo(() => {
    if (routePoints.length < 2) return "8,48 92,12";
    const lngs = routePoints.map((point) => point[0]);
    const lats = routePoints.map((point) => point[1]);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const lngRange = maxLng - minLng || 1;
    const latRange = maxLat - minLat || 1;
    return routePoints
      .filter((_, index) => index % Math.max(1, Math.ceil(routePoints.length / 20)) === 0)
      .map(([lng, lat]) => `${8 + ((lng - minLng) / lngRange) * 84},${44 - ((lat - minLat) / latRange) * 36}`)
      .join(" ");
  }, [routePoints]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <Card className="overflow-hidden border-white/10 bg-[#111114]/90 transition hover:border-red-400/30">
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-400/15 bg-red-400/10 text-red-300">
              <Icon aria-hidden="true" className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="font-display font-semibold text-white">{vehicleNames[ride.vehicleType]} request</p>
              <p className="mt-0.5 text-xs text-zinc-500">{ride.distanceKm.toFixed(1)} km · {ride.durationMin} min</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="text-right">
              <p className="font-display text-lg font-bold text-white">{formatPaise(ride.farePaise, currency)}</p>
              <p className="text-[10px] text-zinc-500">estimated fare</p>
            </div>
            <div className="relative h-9 w-9" title={secondsLeft ? `${secondsLeft} seconds` : "Still open"}>
              <svg className="-rotate-90" viewBox="0 0 36 36" aria-hidden="true">
                <circle cx="18" cy="18" r={radius} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="3" />
                <circle
                  cx="18"
                  cy="18"
                  r={radius}
                  fill="none"
                  stroke="#ef4444"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - progress)}
                  strokeLinecap="round"
                  strokeWidth="3"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-zinc-300">
                {secondsLeft || "•"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_84px] items-center gap-3 rounded-xl border border-white/[0.07] bg-black/20 p-3">
          <div className="min-w-0 space-y-3">
            <AddressRow label="Pickup" address={ride.pickupAddress} color="bg-emerald-400" />
            <AddressRow label="Drop-off" address={ride.dropAddress} color="bg-red-400" />
          </div>
          <svg viewBox="0 0 100 56" className="h-14 w-20" role="img" aria-label="Route preview">
            <polyline points={previewPoints} fill="none" stroke="rgba(239,68,68,.25)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points={previewPoints} fill="none" stroke="#fb5555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={previewPoints.split(" ")[0]?.split(",")[0]} cy={previewPoints.split(" ")[0]?.split(",")[1]} r="3.5" fill="#34d399" />
            <circle cx={previewPoints.split(" ").at(-1)?.split(",")[0]} cy={previewPoints.split(" ").at(-1)?.split(",")[1]} r="3.5" fill="#fb5555" />
          </svg>
        </div>

        <div className="flex gap-2">
          <Button
            className="gradient-red flex-1 text-white hover:brightness-110"
            onClick={onAccept}
            disabled={busy}
          >
            {busy ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Check aria-hidden="true" className="h-4 w-4" />}
            Accept ride
          </Button>
          <Button
            variant="outline"
            className="border-white/10 text-zinc-300 hover:border-red-400/30 hover:text-red-200"
            onClick={onDecline}
            disabled={busy}
            aria-label="Decline ride request"
          >
            <X aria-hidden="true" className="h-4 w-4" />
            <span className="hidden sm:inline">Decline</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AddressRow({ label, address, color }: { label: string; address: string; color: string }) {
  return (
    <div className="flex min-w-0 items-start gap-2.5">
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${color}`} />
      <div className="min-w-0">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
        <p className="mt-0.5 line-clamp-1 text-xs text-zinc-200">{address}</p>
      </div>
    </div>
  );
}

export function DriverDashboard() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { currency } = useCurrency();
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [earnings, setEarnings] = useState<DriverEarningsData | null>(null);
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [manualLocation, setManualLocation] = useState(false);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [statusBusy, setStatusBusy] = useState(false);
  const [busyRideId, setBusyRideId] = useState<string | null>(null);
  const socketRef = useRef<ReturnType<typeof getRideSocket> | null>(null);
  const lastLocationRef = useRef<{ lat: number; lng: number } | null>(null);

  const loadProfileAndEarnings = useCallback(async () => {
    setDashboardError(null);
    try {
      const [meResponse, earningsResponse] = await Promise.all([
        api.get<ApiResponse<{ user: DashboardUser }>>("/auth/me"),
        api.get<ApiResponse<{ earnings: DriverEarningsData }>>("/driver/earnings"),
      ]);
      const nextProfile = meResponse.data.data.user.driverProfile;
      if (!nextProfile) {
        throw new Error("Your driver profile could not be found.");
      }
      setProfile(nextProfile);
      setEarnings(earningsResponse.data.data.earnings);
      if (nextProfile.currentLat !== null && nextProfile.currentLng !== null) {
        setLatitude(String(nextProfile.currentLat));
        setLongitude(String(nextProfile.currentLng));
      }
    } catch (error: unknown) {
      setDashboardError(normalizeApiError(error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRequests = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const response = await api.get<ApiResponse<{ rides: Array<Omit<RideRequest, "receivedAt">> }>>("/driver/requests");
      const fetched = response.data.data.rides.map(requestWithTimestamp);
      setRequests((current) => {
        const liveById = new Map(current.map((ride) => [ride.id, ride]));
        return fetched.map((ride) => liveById.get(ride.id) ?? ride);
      });
      setRequestError(null);
    } catch (error: unknown) {
      setRequestError(normalizeApiError(error).message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadProfileAndEarnings();
  }, [loadProfileAndEarnings]);

  useEffect(() => {
    if (!profile?.isOnline) {
      socketRef.current?.disconnect();
      return;
    }

    const socket = getRideSocket();
    socketRef.current = socket;
    const onRideNew = (ride: unknown) => {
      if (!isRideRequest(ride) || ride.status !== "REQUESTED" || ride.vehicleType !== profile.vehicleType) return;
      const normalized = requestWithTimestamp(ride);
      setRequests((current) => [normalized, ...current.filter((existing) => existing.id !== normalized.id)]);
      toast.info("A new ride request is nearby.");
    };
    const onRideUpdate = () => {
      void loadRequests(true);
    };
    const onSocketError = (event: { message: string }) => toast.error(event.message);

    socket.on("ride:new", onRideNew);
    socket.on("ride:accepted", onRideUpdate);
    socket.on("ride:cancelled", onRideUpdate);
    socket.on("ride:status", onRideUpdate);
    socket.on("socket:error", onSocketError);
    socket.connect();
    void loadRequests(true);

    const refreshTimer = window.setInterval(() => void loadRequests(true), 20000);
    const watchId = navigator.geolocation?.watchPosition(
      ({ coords }) => {
        lastLocationRef.current = { lat: coords.latitude, lng: coords.longitude };
      },
      () => {
        toast.error("Live location updates are unavailable. Check your browser location permission.");
      },
      { enableHighAccuracy: true, maximumAge: 5000 },
    );
    const broadcastTimer = window.setInterval(() => {
      const location = lastLocationRef.current;
      if (location && socket.connected) socket.emit("driver:location", location);
    }, 3000);

    return () => {
      window.clearInterval(refreshTimer);
      window.clearInterval(broadcastTimer);
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
      socket.off("ride:new", onRideNew);
      socket.off("ride:accepted", onRideUpdate);
      socket.off("ride:cancelled", onRideUpdate);
      socket.off("ride:status", onRideUpdate);
      socket.off("socket:error", onSocketError);
      socket.disconnect();
    };
  }, [loadRequests, profile?.isOnline, profile?.vehicleType]);

  const updateStatus = useCallback(async (isOnline: boolean, location?: { lat: number; lng: number }) => {
    setStatusBusy(true);
    try {
      const response = await api.post<ApiResponse<{ profile: Pick<DriverProfile, "isOnline" | "currentLat" | "currentLng"> }>>(
        "/driver/status",
        { isOnline, ...(location ?? {}) },
      );
      setProfile((current) => current ? { ...current, ...response.data.data.profile } : current);
      if (location) {
        setLatitude(String(location.lat));
        setLongitude(String(location.lng));
      }
      setManualLocation(false);
      toast.success(isOnline ? "You’re online and ready for ride requests." : "You’re now offline.");
      if (!isOnline) setRequests([]);
    } catch (error: unknown) {
      toast.error(normalizeApiError(error).message);
    } finally {
      setStatusBusy(false);
    }
  }, []);

  const handleGoOnline = useCallback(() => {
    if (!navigator.geolocation) {
      setManualLocation(true);
      toast.error("Location isn’t available in this browser. Enter your coordinates to continue.");
      return;
    }
    setStatusBusy(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        void updateStatus(true, { lat: coords.latitude, lng: coords.longitude });
      },
      () => {
        setStatusBusy(false);
        setManualLocation(true);
        toast.error("We couldn’t access your location. Allow location access or enter it manually.");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    );
  }, [updateStatus]);

  const submitManualLocation = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
      toast.error("Enter a valid latitude (-90 to 90) and longitude (-180 to 180).");
      return;
    }
    void updateStatus(true, { lat, lng });
  }, [latitude, longitude, updateStatus]);

  const handleAccept = useCallback(async (rideId: string) => {
    setBusyRideId(rideId);
    setRequests((current) => current.filter((ride) => ride.id !== rideId));
    try {
      await api.post(`/rides/${encodeURIComponent(rideId)}/accept`);
      toast.success("Ride accepted. Let’s get moving.");
      router.push(`/ride/${encodeURIComponent(rideId)}`);
    } catch (error: unknown) {
      const normalized = normalizeApiError(error);
      toast.error(normalized.statusCode === 409 ? "This ride was already taken. Requests refreshed." : normalized.message);
      await loadRequests(true);
    } finally {
      setBusyRideId(null);
    }
  }, [loadRequests, router]);

  const handleDecline = useCallback(async (rideId: string) => {
    const previous = requests.find((ride) => ride.id === rideId);
    setBusyRideId(rideId);
    setRequests((current) => current.filter((ride) => ride.id !== rideId));
    try {
      await api.post(`/rides/${encodeURIComponent(rideId)}/decline`);
    } catch (error: unknown) {
      toast.error(normalizeApiError(error).message);
      if (previous) setRequests((current) => [previous, ...current.filter((ride) => ride.id !== rideId)]);
    } finally {
      setBusyRideId(null);
    }
  }, [requests]);

  const chartPayouts = useMemo(() => earnings?.dailyPayouts ?? [], [earnings]);

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center px-5" aria-live="polite">
        <LoaderCircle aria-label="Loading driver dashboard" className="h-7 w-7 animate-spin text-red-400" />
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#111114] p-5 shadow-glow sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-28 h-72 w-72 rounded-full bg-red-600/15 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-300">Driver dashboard</p>
            <h1 className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl">
              Good to see you, {user?.name?.split(" ")[0] ?? "driver"}.
            </h1>
            <p className="mt-2 max-w-xl text-sm text-zinc-400">
              Go online to discover nearby rides and make every trip count.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-4 text-sm">
              <span className="inline-flex items-center gap-1.5 text-amber-300">
                <Star aria-hidden="true" className="h-4 w-4 fill-current" />
                {profile?.ratingAvg.toFixed(1) ?? "0.0"}
                <span className="text-xs text-zinc-500">({profile?.ratingCount ?? 0} ratings)</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-zinc-300">
                <Route aria-hidden="true" className="h-4 w-4 text-red-300" />
                {earnings?.tripCount ?? 0} completed trips
              </span>
              {profile && (
                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-zinc-400">
                  {vehicleNames[profile.vehicleType]} · {profile.vehicleModel}
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
            <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${profile?.isOnline ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-white/10 bg-black/20 text-zinc-400"}`}>
              {profile?.isOnline ? <Signal aria-hidden="true" className="h-4 w-4" /> : <SignalZero aria-hidden="true" className="h-4 w-4" />}
              {profile?.isOnline ? "You’re online" : "You’re offline"}
            </div>
            <Button
              className={profile?.isOnline ? "border border-white/10 bg-white/[0.06] text-white hover:bg-white/10" : "gradient-red text-white hover:brightness-110"}
              variant={profile?.isOnline ? "outline" : "default"}
              onClick={() => profile?.isOnline ? void updateStatus(false) : handleGoOnline()}
              disabled={statusBusy || !profile}
              role="switch"
              aria-checked={profile?.isOnline ?? false}
            >
              {statusBusy ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : null}
              {profile?.isOnline ? "Go offline" : "Go online"}
            </Button>
          </div>
        </div>

        {manualLocation && !profile?.isOnline && (
          <form onSubmit={submitManualLocation} className="relative mt-6 grid gap-3 rounded-2xl border border-red-400/20 bg-black/25 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div className="sm:col-span-3">
              <p className="text-sm font-semibold text-white">Share your starting location</p>
              <p className="mt-1 text-xs text-zinc-400">
                To receive nearby requests, allow location access in your browser settings or enter coordinates manually.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="driver-latitude" className="text-xs text-zinc-400">Latitude</Label>
              <Input id="driver-latitude" inputMode="decimal" placeholder="e.g. 24.5373" value={latitude} onChange={(event) => setLatitude(event.target.value)} className="border-white/10 bg-black/30" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="driver-longitude" className="text-xs text-zinc-400">Longitude</Label>
              <Input id="driver-longitude" inputMode="decimal" placeholder="e.g. 81.3042" value={longitude} onChange={(event) => setLongitude(event.target.value)} className="border-white/10 bg-black/30" />
            </div>
            <Button type="submit" disabled={statusBusy} className="gradient-red text-white">
              {statusBusy ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Navigation aria-hidden="true" className="h-4 w-4" />}
              Go online
            </Button>
          </form>
        )}
      </section>

      {dashboardError && (
        <Card className="mt-5 border-red-400/20 bg-red-400/[0.06]">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2 text-sm text-red-200"><AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />{dashboardError}</p>
            <Button variant="outline" onClick={() => void loadProfileAndEarnings()}><RefreshCw aria-hidden="true" className="h-4 w-4" />Retry</Button>
          </CardContent>
        </Card>
      )}

      <section className="mt-6 grid gap-4 sm:grid-cols-3" aria-label="Driver earnings">
        <EarningCard title="Today" amount={earnings?.todayPaise ?? 0} caption="Your payout so far" icon={<Coins aria-hidden="true" className="h-5 w-5" />} />
        <EarningCard title="This week" amount={earnings?.thisWeekPaise ?? 0} caption="Since Monday" icon={<Wallet aria-hidden="true" className="h-5 w-5" />} />
        <EarningCard title="All time" amount={earnings?.allTimePaise ?? 0} caption={`${earnings?.tripCount ?? 0} completed trips`} icon={<ArrowUpRight aria-hidden="true" className="h-5 w-5" />} />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
        <Card className="border-white/10 bg-[#111114]/90">
          <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
            <div>
              <CardTitle>Ride requests</CardTitle>
              <CardDescription className="mt-2">
                {profile?.isOnline ? "New requests within 15 km appear here." : "Go online to see requests near you."}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => void loadRequests()} disabled={!profile?.isOnline || refreshing}>
              {refreshing ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <RefreshCw aria-hidden="true" className="h-4 w-4" />}
              <span className="sr-only sm:not-sr-only">Refresh</span>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {!profile?.isOnline ? (
              <EmptyRequests icon={<SignalZero aria-hidden="true" className="h-6 w-6" />} title="You’re offline" description="Switch online when you’re ready to accept trips." />
            ) : requestError ? (
              <div className="rounded-xl border border-red-400/20 bg-red-400/[0.06] p-4">
                <p className="flex items-start gap-2 text-sm text-red-200"><AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />{requestError}</p>
                <Button className="mt-3" size="sm" variant="outline" onClick={() => void loadRequests()}><RefreshCw aria-hidden="true" className="h-4 w-4" />Try again</Button>
              </div>
            ) : requests.length === 0 ? (
              <EmptyRequests icon={<MapPin aria-hidden="true" className="h-6 w-6" />} title="No requests nearby" description="We’ll let you know as soon as a ride is available." />
            ) : (
              requests.map((ride) => (
                <RequestCard
                  key={ride.id}
                  ride={ride}
                  busy={busyRideId === ride.id}
                  onAccept={() => void handleAccept(ride.id)}
                  onDecline={() => void handleDecline(ride.id)}
                />
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#111114]/90">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Weekly earnings</CardTitle>
                <CardDescription className="mt-2">Your driver payout over the last seven days.</CardDescription>
              </div>
              <span className="rounded-lg bg-red-400/10 p-2 text-red-300"><ArrowDown aria-hidden="true" className="h-4 w-4" /></span>
            </div>
          </CardHeader>
          <CardContent>
            {chartPayouts.length > 0 ? (
              <>
                <EarningsChart dailyPayouts={chartPayouts} />
                <div className="mt-3 flex items-center justify-between border-t border-white/[0.07] pt-4">
                  <span className="text-xs text-zinc-500">Total this week</span>
                  <span className="font-display text-lg font-bold text-white">{formatPaise(earnings?.thisWeekPaise ?? 0, currency)}</span>
                </div>
              </>
            ) : (
              <div className="flex min-h-48 flex-col items-center justify-center text-center">
                <Clock3 aria-hidden="true" className="h-7 w-7 text-zinc-600" />
                <p className="mt-3 text-sm font-medium text-zinc-300">Your chart is getting ready</p>
                <p className="mt-1 text-xs text-zinc-500">Earnings from completed paid trips will appear here.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

export function EarningCard({ title, amount, caption, icon }: { title: string; amount: number; caption: string; icon: React.ReactNode }) {
  const { currency } = useCurrency();
  return (
    <Card className="border-white/10 bg-[#111114]/90">
      <CardContent className="flex items-center justify-between gap-3 p-5">
        <div>
          <p className="text-xs font-medium text-zinc-500">{title}</p>
          <p className="mt-2 font-display text-2xl font-bold text-white">{formatPaise(amount, currency)}</p>
          <p className="mt-1 text-xs text-zinc-500">{caption}</p>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-400/15 bg-red-400/10 text-red-300">{icon}</span>
      </CardContent>
    </Card>
  );
}

function EmptyRequests({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-black/10 px-5 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-zinc-400">{icon}</span>
      <p className="mt-4 text-sm font-semibold text-zinc-200">{title}</p>
      <p className="mt-1 max-w-xs text-xs leading-5 text-zinc-500">{description}</p>
    </div>
  );
}
