"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  CreditCard,
  LoaderCircle,
  MapPin,
  Navigation,
  Phone,
  RotateCw,
  Route,
  ShieldCheck,
  Star,
  UserRound,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProtectedRoute } from "@/components/shared/protected-route";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { useCurrency } from "@/hooks/use-currency";
import { api, normalizeApiError } from "@/lib/api";
import { formatDateTime, formatPaise } from "@/lib/format";
import { getRideSocket } from "@/lib/socket";
import { useAuthStore } from "@/store/auth-store";

const RideTrackingMap = dynamic(() => import("@/components/ride/ride-tracking-map"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[340px] animate-pulse bg-zinc-900" aria-label="Loading live map" aria-busy="true">
      <div className="h-full min-h-[340px] bg-white/[0.03]" />
    </div>
  ),
});

const StripePayment = dynamic(() => import("@/components/ride/stripe-payment"), {
  ssr: false,
  loading: () => (
    <div className="space-y-3" aria-label="Loading secure payment form" aria-busy="true">
      <div className="h-11 animate-pulse rounded-lg bg-white/[0.06]" />
      <div className="h-11 animate-pulse rounded-lg bg-white/[0.06]" />
      <div className="h-11 animate-pulse rounded-lg bg-red-500/20" />
    </div>
  ),
});

type RideStatus =
  | "REQUESTED"
  | "ACCEPTED"
  | "ARRIVED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";
type VehicleType = "BIKE" | "AUTO" | "CAB" | "PREMIUM";
type Person = {
  id: string;
  name: string;
  phone: string;
  avatarUrl: string | null;
  driverProfile?: {
    vehicleType: VehicleType;
    vehicleModel: string;
    vehicleNumber: string;
    ratingAvg: number;
    ratingCount: number;
  } | null;
};
type RideDetails = {
  id: string;
  riderId: string;
  driverId: string | null;
  status: RideStatus;
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
  requestedAt: string;
  acceptedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  rider: Person;
  driver: Person | null;
};
type ApiResponse<T> = { data: T };
type RideResponse = ApiResponse<{ ride: RideDetails }>;
type PaymentIntentResponse = ApiResponse<{ clientSecret: string; paymentIntentId: string }>;
type RidePayment = {
  rideId: string;
  amountMinor: number;
  currency: "INR" | "USD";
  status: "PENDING" | "SUCCEEDED" | "FAILED";
  receiptNumber: string;
  paidAt: string | null;
};
type PaymentResponse = ApiResponse<{ payment: RidePayment }>;
type Review = { id: string; rating: number; comment: string | null };
type ReviewResponse = ApiResponse<{ review: Review }>;

const statusSteps: Array<{ id: RideStatus; label: string }> = [
  { id: "REQUESTED", label: "Requested" },
  { id: "ACCEPTED", label: "Accepted" },
  { id: "ARRIVED", label: "Arrived" },
  { id: "IN_PROGRESS", label: "In progress" },
  { id: "COMPLETED", label: "Completed" },
];
const statusOrder = statusSteps.map((step) => step.id);
const vehicleNames: Record<VehicleType, string> = {
  BIKE: "Bike",
  AUTO: "Auto",
  CAB: "Cab",
  PREMIUM: "Premium",
};

const routeCoordinates = (geometry: unknown): [number, number][] => {
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
      Number.isFinite(point[0]) &&
      typeof point[1] === "number" &&
      Number.isFinite(point[1]),
  );
};

function RidePageContent({ rideId }: { rideId: string }) {
  const user = useAuthStore((state) => state.user);
  const reducedMotion = useReducedMotion();
  const { currency, setCurrency } = useCurrency();
  const [ride, setRide] = useState<RideDetails | null>(null);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [hasConnected, setHasConnected] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [payment, setPayment] = useState<RidePayment | null>(null);
  const [paymentSecret, setPaymentSecret] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);
  const [paymentSuccessJustNow, setPaymentSuccessJustNow] = useState(false);
  const [review, setReview] = useState<Review | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const socketRef = useRef<ReturnType<typeof getRideSocket> | null>(null);
  const driverLocationRef = useRef<{ lat: number; lng: number } | null>(null);
  const driverIdRef = useRef<string | null>(null);
  const simulationTimer = useRef<number | null>(null);
  const locationPermissionErrorShown = useRef(false);
  const simulationIndex = useRef(0);
  const driverId = user?.role === "DRIVER" ? user.id : ride?.driverId;
  driverIdRef.current = driverId ?? null;
  const userId = user?.id;
  const rideReady = ride !== null;
  const isDriver = user?.role === "DRIVER";
  const isRider = user?.role === "RIDER";
  const isActive = ride ? !["COMPLETED", "CANCELLED"].includes(ride.status) : false;

  const updateDriverLocation = useCallback((location: { lat: number; lng: number }) => {
    driverLocationRef.current = location;
    setDriverLocation(location);
  }, []);

  const loadRide = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const response = await api.get<RideResponse>(`/rides/${encodeURIComponent(rideId)}`);
      const nextRide = response.data.data.ride;
      setRide(nextRide);
    } catch (requestError: unknown) {
      setError(normalizeApiError(requestError).message);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [rideId]);

  useEffect(() => {
    void loadRide(true);
  }, [loadRide]);

  useEffect(() => {
    if (!rideReady || !userId) return;
    const socket = getRideSocket();
    socketRef.current = socket;
    const onConnect = () => {
      setSocketConnected(true);
      setHasConnected(true);
      socket.emit("ride:join", { rideId });
      void loadRide();
    };
    const onDisconnect = () => setSocketConnected(false);
    const onConnectError = () => setSocketConnected(false);
    const applyRideUpdate = (eventRide: Partial<RideDetails>) => {
      if (eventRide.id !== rideId) return;
      setRide((current) => current ? { ...current, ...eventRide } : current);
    };
    const onRideStatus = (payload: { ride: Partial<RideDetails> }) => applyRideUpdate(payload.ride);
    const onRideAccepted = (eventRide: Partial<RideDetails>) => applyRideUpdate(eventRide);
    const onRideCancelled = (eventRide: Partial<RideDetails>) => applyRideUpdate(eventRide);
    const onDriverLocation = (payload: { driverId: string; lat: number; lng: number }) => {
      if (payload.driverId === driverIdRef.current) {
        updateDriverLocation({ lat: payload.lat, lng: payload.lng });
      }
    };
    const onSocketError = (payload: { message: string }) => toast.error(payload.message);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("ride:status", onRideStatus);
    socket.on("ride:accepted", onRideAccepted);
    socket.on("ride:cancelled", onRideCancelled);
    socket.on("driver:location", onDriverLocation);
    socket.on("socket:error", onSocketError);
    socket.connect();
    if (socket.connected) onConnect();

    return () => {
      socket.emit("ride:leave", { rideId });
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("ride:status", onRideStatus);
      socket.off("ride:accepted", onRideAccepted);
      socket.off("ride:cancelled", onRideCancelled);
      socket.off("driver:location", onDriverLocation);
      socket.off("socket:error", onSocketError);
      socket.disconnect();
    };
  }, [loadRide, rideReady, rideId, updateDriverLocation, userId]);

  useEffect(() => {
    if (!isDriver || !isActive || !socketConnected) return;
    if (!navigator.geolocation) {
      if (!locationPermissionErrorShown.current) {
        toast.error("Live location is unavailable in this browser.");
        locationPermissionErrorShown.current = true;
      }
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      ({ coords }) => {
        locationPermissionErrorShown.current = false;
        const location = { lat: coords.latitude, lng: coords.longitude };
        driverLocationRef.current = location;
      },
      () => {
        if (!locationPermissionErrorShown.current) {
          toast.error("Allow location access to share your live position with the rider.");
          locationPermissionErrorShown.current = true;
        }
      },
      { enableHighAccuracy: true, maximumAge: 5000 },
    );
    const emitLocation = () => {
      const location = driverLocationRef.current;
      if (!location || !socketRef.current?.connected) return;
      updateDriverLocation(location);
      socketRef.current.emit("driver:location", { ...location, rideId });
    };
    emitLocation();
    const timer = window.setInterval(emitLocation, 3000);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      window.clearInterval(timer);
    };
  }, [isActive, isDriver, rideId, socketConnected, updateDriverLocation]);

  useEffect(() => {
    if (!isActive || socketConnected) return;
    const timer = window.setInterval(() => void loadRide(), 15000);
    return () => window.clearInterval(timer);
  }, [isActive, loadRide, socketConnected]);

  useEffect(() => {
    if (user?.role !== "RIDER" || ride?.status !== "COMPLETED") return;
    let cancelled = false;
    const loadPaymentAndReview = async () => {
      try {
        const response = await api.get<PaymentResponse>(`/payments/${encodeURIComponent(rideId)}`);
        if (cancelled) return;
        const savedPayment = response.data.data.payment;
        setPayment(savedPayment);
        setPaid(savedPayment.status === "SUCCEEDED");
        if (savedPayment.status === "PENDING") setCurrency(savedPayment.currency);
        if (savedPayment.status === "SUCCEEDED") {
          try {
            const reviewResponse = await api.get<ReviewResponse>(`/reviews/ride/${encodeURIComponent(rideId)}`);
            if (!cancelled) setReview(reviewResponse.data.data.review);
          } catch (reviewError: unknown) {
            if (normalizeApiError(reviewError).statusCode !== 404 && !cancelled) {
              toast.error(normalizeApiError(reviewError).message);
            }
          }
        }
      } catch (paymentLookupError: unknown) {
        const normalized = normalizeApiError(paymentLookupError);
        if (normalized.statusCode !== 404 && !cancelled) {
          setPaymentError(normalized.message);
        }
      }
    };
    void loadPaymentAndReview();
    return () => {
      cancelled = true;
    };
  }, [ride?.status, rideId, setCurrency, user?.role]);

  useEffect(() => () => {
    if (simulationTimer.current !== null) window.clearInterval(simulationTimer.current);
  }, []);

  const path = useMemo(() => routeCoordinates(ride?.routeGeometry), [ride?.routeGeometry]);
  const isCancelled = ride?.status === "CANCELLED";
  const currentStepIndex = ride ? statusOrder.indexOf(ride.status) : -1;
  const showPayment = isRider && ride?.status === "COMPLETED" && !paid;
  const showReview = isRider && ride?.status === "COMPLETED" && paid && !review && !paymentSuccessJustNow;

  useEffect(() => {
    if (!paymentSuccessJustNow) return;
    const timer = window.setTimeout(() => setPaymentSuccessJustNow(false), 1800);
    return () => window.clearTimeout(timer);
  }, [paymentSuccessJustNow]);

  const runAction = useCallback(async (action: "arrived" | "start" | "complete") => {
    setActionLoading(true);
    try {
      const response = await api.post<RideResponse>(`/rides/${encodeURIComponent(rideId)}/${action}`);
      setRide(response.data.data.ride);
      toast.success(
        action === "arrived" ? "Rider notified that you’ve arrived." :
          action === "start" ? "Trip started. Drive safely." : "Trip completed.",
      );
    } catch (actionError: unknown) {
      toast.error(normalizeApiError(actionError).message);
      await loadRide();
    } finally {
      setActionLoading(false);
    }
  }, [loadRide, rideId]);

  const submitCancel = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const reason = cancelReason.trim();
    if (!reason) {
      setCancelError("Please enter a cancellation reason.");
      return;
    }
    setActionLoading(true);
    setCancelError(null);
    try {
      const response = await api.post<RideResponse>(`/rides/${encodeURIComponent(rideId)}/cancel`, { reason });
      setRide(response.data.data.ride);
      setCancelOpen(false);
      toast.success("Ride cancelled.");
    } catch (cancelRequestError: unknown) {
      const message = normalizeApiError(cancelRequestError).message;
      setCancelError(message);
    } finally {
      setActionLoading(false);
    }
  }, [cancelReason, rideId]);

  const createPaymentIntent = useCallback(async () => {
    setPaymentLoading(true);
    setPaymentError(null);
    try {
      const response = await api.post<PaymentIntentResponse>("/payments/intent", {
        rideId,
        currency,
      });
      setPaymentSecret(response.data.data.clientSecret);
      setPayment((current) => current ? { ...current, currency, status: "PENDING" } : current);
    } catch (intentError: unknown) {
      const message = normalizeApiError(intentError).message;
      setPaymentError(message);
      toast.error(message);
    } finally {
      setPaymentLoading(false);
    }
  }, [currency, rideId]);

  const confirmSucceededPayment = useCallback(async (paymentIntentId: string) => {
    try {
      await api.post("/payments/confirm", { paymentIntentId });
      setPaid(true);
      setPaymentSuccessJustNow(true);
      setPayment((current) => current ? { ...current, status: "SUCCEEDED", paidAt: new Date().toISOString() } : current);
      setPaymentSecret(null);
      toast.success("Payment confirmed. Thank you!");
    } catch (confirmError: unknown) {
      const message = normalizeApiError(confirmError).message;
      setPaymentError(message);
      toast.error(`Payment was processed by Stripe, but RideX could not confirm it: ${message}`);
    }
  }, []);

  const submitReview = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setReviewLoading(true);
    try {
      const response = await api.post<ReviewResponse>("/reviews", {
        rideId,
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });
      setReview(response.data.data.review);
      toast.success("Thanks for sharing your experience.");
    } catch (reviewError: unknown) {
      toast.error(normalizeApiError(reviewError).message);
    } finally {
      setReviewLoading(false);
    }
  }, [reviewComment, reviewRating, rideId]);

  const downloadReceipt = useCallback(async () => {
    setReceiptLoading(true);
    try {
      const response = await api.get<ApiResponse<Record<string, unknown>>>(
        `/receipts/${encodeURIComponent(rideId)}`,
      );
      const receipt = response.data.data;
      const lines = [
        "RideX payment receipt",
        `Receipt: ${String(receipt.receiptNumber ?? "")}`,
        `Date: ${formatDateTime(String(receipt.date ?? ""))}`,
        `Rider: ${String((receipt.rider as { name?: string } | undefined)?.name ?? "")}`,
        `Driver: ${String((receipt.driver as { name?: string } | undefined)?.name ?? "")}`,
        `Pickup: ${String((receipt.pickup as { address?: string } | undefined)?.address ?? "")}`,
        `Drop-off: ${String((receipt.drop as { address?: string } | undefined)?.address ?? "")}`,
        `Distance: ${String(receipt.distanceKm ?? "")} km`,
        `Total: ${String((receipt.payment as { currency?: string; totalAmount?: string } | undefined)?.currency ?? "")} ${String((receipt.payment as { totalAmount?: string } | undefined)?.totalAmount ?? "")}`,
        `Payment status: ${String((receipt.payment as { status?: string } | undefined)?.status ?? "")}`,
      ];
      const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${String(receipt.receiptNumber ?? `ridex-${rideId}`)}.txt`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success("Receipt downloaded.");
    } catch (receiptError: unknown) {
      toast.error(normalizeApiError(receiptError).message);
    } finally {
      setReceiptLoading(false);
    }
  }, [rideId]);

  const simulateMovement = useCallback(() => {
    if (!path.length || !socketRef.current?.connected) {
      toast.error("Connect to RideX and load a route before simulating movement.");
      return;
    }
    if (simulationTimer.current !== null) {
      window.clearInterval(simulationTimer.current);
      simulationTimer.current = null;
      toast.info("Movement simulation stopped.");
      return;
    }
    const startAt = driverLocation
      ? path.reduce((nearest, point, index) => {
          const [lng, lat] = point;
          const previous = path[nearest];
          const currentDistance = Math.hypot(lat - driverLocation.lat, lng - driverLocation.lng);
          const previousDistance = Math.hypot(previous[1] - driverLocation.lat, previous[0] - driverLocation.lng);
          return currentDistance < previousDistance ? index : nearest;
        }, 0)
      : 0;
    simulationIndex.current = startAt;
    const emitPosition = () => {
      const point = path[simulationIndex.current % path.length];
      const location = { lat: point[1], lng: point[0] };
      updateDriverLocation(location);
      socketRef.current?.emit("driver:location", { ...location, rideId });
      simulationIndex.current += Math.max(1, Math.floor(path.length / 40));
      if (simulationIndex.current >= path.length) {
        if (simulationTimer.current !== null) window.clearInterval(simulationTimer.current);
        simulationTimer.current = null;
        toast.success("Movement simulation complete.");
      }
    };
    emitPosition();
    simulationTimer.current = window.setInterval(emitPosition, 3000);
    toast.info("Simulating driver movement along the route.");
  }, [driverLocation, path, rideId, updateDriverLocation]);

  if (loading) {
    return <PageSkeleton cards={2} />;
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
            <Button variant="outline" onClick={() => void loadRide(true)}>
              <RotateCw aria-hidden="true" className="h-4 w-4" /> Try again
            </Button>
            <Button asChild><Link href={isDriver ? "/driver" : "/book"}>Back</Link></Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 pb-14 pt-7 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={isDriver ? "/driver" : "/history"}
          className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          {isDriver ? "Driver dashboard" : "Ride history"}
        </Link>
        <div className="flex items-center gap-2">
          {!socketConnected && hasConnected && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs text-amber-200" role="status">
              <LoaderCircle aria-hidden="true" className="h-3.5 w-3.5 animate-spin" /> Reconnecting…
            </span>
          )}
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs ${socketConnected ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200" : "border-white/10 bg-white/[0.04] text-zinc-400"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${socketConnected ? "bg-emerald-400" : "bg-zinc-500"}`} />
            {socketConnected ? "Live updates" : "Connecting"}
          </span>
          {process.env.NODE_ENV !== "production" && isDriver && isActive && (
            <Button size="sm" variant="outline" onClick={simulateMovement}>
              <Navigation aria-hidden="true" className="h-4 w-4" /> Simulate movement
            </Button>
          )}
        </div>
      </div>

      {isCancelled ? (
        <Card className="mb-5 border-red-400/20 bg-red-400/[0.06]">
          <CardContent className="flex items-start gap-3 p-4">
            <XCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />
            <div>
              <p className="font-semibold text-red-100">This ride was cancelled</p>
              {ride.cancelReason && <p className="mt-1 text-sm text-red-100/70">Reason: {ride.cancelReason}</p>}
            </div>
          </CardContent>
        </Card>
      ) : (
        <StatusStepper status={ride.status} currentIndex={currentStepIndex} reducedMotion={Boolean(reducedMotion)} />
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(340px,.85fr)]">
        <div className="space-y-5">
          <Card className="overflow-hidden border-white/10 bg-[#111114]/90">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/[0.07] p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-300">Ride in progress</p>
                <h1 className="mt-1 font-display text-2xl font-bold text-white">
                  {statusHeadline(ride.status, isDriver)}
                </h1>
                <p className="mt-1 text-sm text-zinc-400">
                  {ride.distanceKm.toFixed(1)} km · about {ride.durationMin} min · {vehicleNames[ride.vehicleType]}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-right">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500">Fare</p>
                <p className="font-display text-xl font-bold text-white">{formatPaise(ride.farePaise, currency)}</p>
              </div>
            </div>

            <div className="relative h-[340px] sm:h-[440px]">
              <RideTrackingMap
                pickup={{ lat: ride.pickupLat, lng: ride.pickupLng }}
                drop={{ lat: ride.dropLat, lng: ride.dropLng }}
                geometry={path}
                driverLocation={driverLocation}
              />
              {ride.status === "REQUESTED" && (
                <div className="absolute inset-x-3 top-3 z-[500] flex justify-center sm:inset-x-5 sm:top-5">
                  <div className="flex w-full max-w-md items-center gap-3 rounded-2xl border border-white/10 bg-zinc-950/90 p-3 shadow-xl backdrop-blur-xl">
                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
                      {!reducedMotion && (
                        <>
                          <span className="absolute inset-0 animate-ping rounded-full border border-red-400/30 [animation-duration:2.8s]" />
                          <span className="absolute inset-2 animate-ping rounded-full border border-red-400/30 [animation-delay:.7s] [animation-duration:2.8s]" />
                        </>
                      )}
                      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-red-400/25 bg-red-400/10 text-red-300">
                        <Navigation aria-hidden="true" className="h-4 w-4" />
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-display text-sm font-semibold text-white">Finding your driver</h2>
                      <p className="mt-0.5 text-xs text-zinc-400">Sharing your ride with nearby drivers.</p>
                    </div>
                    {isRider && <Button size="sm" variant="outline" className="border-white/10" onClick={() => setCancelOpen(true)}>Cancel</Button>}
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card className="border-white/10 bg-[#111114]/90">
            <CardHeader>
              <CardTitle>Trip details</CardTitle>
              <CardDescription>Ride ID {ride.id}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <AddressSummary label="Pickup" address={ride.pickupAddress} icon={<span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />} />
              <AddressSummary label="Drop-off" address={ride.dropAddress} icon={<MapPin aria-hidden="true" className="h-4 w-4 text-red-300" />} />
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-5">
          {isRider && ride.driver && <DriverCard person={ride.driver} />}
          {isDriver && <RiderCard person={ride.rider} />}

          {isDriver && isActive && (
            <Card className="border-white/10 bg-[#111114]/90">
              <CardHeader>
                <CardTitle>Ride actions</CardTitle>
                <CardDescription>Actions are enabled in the order required by the trip.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {ride.status === "ACCEPTED" && <ActionButton loading={actionLoading} onClick={() => void runAction("arrived")}>I’ve arrived</ActionButton>}
                {ride.status === "ARRIVED" && <ActionButton loading={actionLoading} onClick={() => void runAction("start")}>Start trip</ActionButton>}
                {ride.status === "IN_PROGRESS" && <ActionButton loading={actionLoading} onClick={() => void runAction("complete")}>Complete trip</ActionButton>}
                {ride.status === "REQUESTED" && <p className="rounded-xl bg-white/[0.035] p-3 text-sm text-zinc-400">This ride is still waiting for a driver to accept it.</p>}
              </CardContent>
            </Card>
          )}

          {isRider && (ride.status === "ACCEPTED" || ride.status === "ARRIVED") && (
            <Card className="border-white/10 bg-[#111114]/90">
              <CardHeader>
                <CardTitle>Need to cancel?</CardTitle>
                <CardDescription>You can cancel before the trip starts.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full border-white/10" onClick={() => setCancelOpen(true)}>Cancel ride</Button>
              </CardContent>
            </Card>
          )}

          {isRider && ride.status === "COMPLETED" && (
            <AnimatePresence mode="wait">
              {paymentSuccessJustNow ? (
                <motion.div key="payment-success" initial={reducedMotion ? false : { opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
                  <Card className="border-emerald-400/20 bg-emerald-400/[0.045]">
                    <CardContent className="p-5">
                      <SuccessState title="Payment successful" description="Your ride is paid. Thank you for choosing RideX." />
                    </CardContent>
                  </Card>
                </motion.div>
              ) : showPayment ? (
                <motion.div key="payment" initial={reducedMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <Card className="border-red-400/20 bg-[#111114]/95 shadow-glow">
                    <CardHeader>
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-400/10 text-red-300"><CreditCard aria-hidden="true" className="h-5 w-5" /></div>
                      <CardTitle className="mt-3">Pay for your ride</CardTitle>
                      <CardDescription>Your trip is complete. Choose a currency and pay securely.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-black/20 p-4">
                        <span className="text-sm text-zinc-400">Total fare</span>
                        <span className="font-display text-2xl font-bold text-white">{formatPaise(ride.farePaise, currency)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-zinc-500">Payment currency</span>
                        <div className="inline-flex rounded-full border border-white/10 bg-black/20 p-1" aria-label="Payment currency">
                          {(["INR", "USD"] as const).map((code) => (
                            <button
                              key={code}
                              type="button"
                              onClick={() => setCurrency(code)}
                              disabled={payment?.status === "PENDING"}
                              aria-pressed={currency === code}
                              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${currency === code ? "bg-red-500 text-white" : "text-zinc-400 hover:text-white"} disabled:cursor-not-allowed disabled:opacity-50`}
                            >
                              {code}
                            </button>
                          ))}
                        </div>
                      </div>
                      {!paymentSecret ? (
                        <Button className="gradient-red w-full text-white hover:brightness-110" onClick={() => void createPaymentIntent()} disabled={paymentLoading}>
                          {paymentLoading ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <ShieldCheck aria-hidden="true" className="h-4 w-4" />}
                          {payment?.status === "PENDING" ? "Resume secure payment" : "Continue to secure payment"}
                        </Button>
                      ) : <StripePayment clientSecret={paymentSecret} onPaid={confirmSucceededPayment} />}
                      {paymentError && <p className="text-xs text-red-300" role="alert">{paymentError}</p>}
                      <p className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-500"><ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />Secured by Stripe</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : showReview ? (
                <motion.div key="review" initial={reducedMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <Card className="border-amber-400/15 bg-[#111114]/95">
                    <CardHeader>
                      <CardTitle>How was your ride?</CardTitle>
                      <CardDescription>Your feedback helps make RideX better for everyone.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={(event) => void submitReview(event)} className="space-y-4">
                        <div className="flex items-center justify-center gap-2" role="group" aria-label="Choose a rating">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              type="button"
                              aria-label={`${rating} star${rating === 1 ? "" : "s"}`}
                              aria-pressed={reviewRating === rating}
                              onClick={() => setReviewRating(rating)}
                              className="rounded-md p-1 text-amber-300 transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                            >
                              <Star className={`h-8 w-8 ${rating <= reviewRating ? "fill-current" : "text-zinc-600"}`} />
                            </button>
                          ))}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ride-review-comment">Comment <span className="text-zinc-500">(optional)</span></Label>
                          <textarea
                            id="ride-review-comment"
                            value={reviewComment}
                            onChange={(event) => setReviewComment(event.target.value)}
                            maxLength={500}
                            rows={3}
                            placeholder="Tell us what went well…"
                            className="w-full resize-y rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          />
                          <p className="text-right text-[10px] text-zinc-500">{reviewComment.length}/500</p>
                        </div>
                        <Button type="submit" className="gradient-red w-full text-white" disabled={reviewLoading}>
                          {reviewLoading ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Star aria-hidden="true" className="h-4 w-4" />}
                          Submit review
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div key="paid" initial={reducedMotion ? false : { opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
                  <Card className="border-emerald-400/20 bg-emerald-400/[0.045]">
                    <CardContent className="p-5">
                      <SuccessState title={review ? "Thank you for your review!" : "Payment successful"} description={review ? "Your ride experience has been shared with the driver." : "Your ride is paid. We appreciate you choosing RideX."} />
                      {review && <p className="mt-3 text-center text-sm text-amber-300">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>}
                      <Button className="mt-5 w-full" variant="outline" onClick={() => void downloadReceipt()} disabled={receiptLoading}>
                        {receiptLoading ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Check aria-hidden="true" className="h-4 w-4" />}
                        Download receipt
                      </Button>
                      <Button asChild variant="ghost" className="mt-2 w-full text-zinc-400">
                        <Link href="/history">View ride history</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </aside>
      </div>

      <Dialog open={cancelOpen} onOpenChange={(open) => {
        setCancelOpen(open);
        if (!open) setCancelError(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this ride?</DialogTitle>
            <DialogDescription>Please tell us why you’re cancelling. This can’t be undone.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(event) => void submitCancel(event)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cancel-reason">Reason</Label>
              <Input
                id="cancel-reason"
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
                maxLength={500}
                placeholder="Plans changed, wait time, etc."
                className="border-white/10 bg-black/20"
                autoFocus
              />
              {cancelError && <p className="text-xs text-red-300" role="alert">{cancelError}</p>}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCancelOpen(false)}>Keep ride</Button>
              <Button type="submit" variant="destructive" disabled={actionLoading}>
                {actionLoading && <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />}
                Confirm cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function StatusStepper({ status, currentIndex, reducedMotion }: { status: RideStatus; currentIndex: number; reducedMotion: boolean }) {
  return (
    <Card className="border-white/10 bg-[#111114]/90 p-4 sm:p-5">
      <div className="relative flex items-start justify-between">
        <div className="absolute left-[8%] right-[8%] top-4 h-px bg-white/10">
          <motion.div
            className="h-full origin-left bg-gradient-to-r from-red-500 to-orange-400"
            initial={false}
            animate={{ scaleX: Math.max(0, currentIndex) / (statusSteps.length - 1) }}
            transition={reducedMotion ? { duration: 0 } : { duration: 0.5, ease: "easeOut" }}
          />
        </div>
        {statusSteps.map((step, index) => {
          const complete = index < currentIndex;
          const active = index === currentIndex;
          return (
            <div key={step.id} className="relative z-10 flex w-1/5 flex-col items-center gap-2 text-center">
              <span className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs transition ${complete ? "border-red-400 bg-red-500 text-white" : active ? "border-red-300 bg-red-400/15 text-red-200 shadow-[0_0_18px_rgba(239,68,68,.22)]" : "border-white/10 bg-[#111114] text-zinc-600"}`}>
                {complete ? <Check aria-hidden="true" className="h-4 w-4" /> : index + 1}
              </span>
              <span className={`text-[9px] leading-3 sm:text-xs ${complete || active ? "text-zinc-200" : "text-zinc-600"}`}>{step.label}</span>
            </div>
          );
        })}
      </div>
      {status === "COMPLETED" && (
        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-emerald-300">
          <CheckCircle2 aria-hidden="true" className="h-4 w-4" />Trip completed
        </p>
      )}
    </Card>
  );
}

function DriverCard({ person }: { person: Person }) {
  const profile = person.driverProfile;
  return (
    <Card className="border-white/10 bg-[#111114]/90">
      <CardHeader className="pb-4">
        <CardDescription>Your driver</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <Avatar name={person.name} avatarUrl={person.avatarUrl} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-white">{person.name}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-amber-300">
              <Star aria-hidden="true" className="h-3.5 w-3.5 fill-current" />
              {profile?.ratingAvg.toFixed(1) ?? "New"} <span className="text-zinc-500">({profile?.ratingCount ?? 0})</span>
            </p>
          </div>
          <a
            href={`tel:${encodeURIComponent(person.phone)}`}
            aria-label={`Call driver ${person.name}`}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10 text-emerald-300 transition hover:bg-emerald-400/20"
          >
            <Phone aria-hidden="true" className="h-4 w-4" />
          </a>
        </div>
        {profile && (
          <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-white/[0.07] bg-black/20 p-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">Vehicle</p>
              <p className="mt-1 text-sm font-medium text-zinc-200">{vehicleNames[profile.vehicleType]} · {profile.vehicleModel}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">Plate</p>
              <p className="mt-1 font-mono text-sm font-semibold text-white">{profile.vehicleNumber}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RiderCard({ person }: { person: Person }) {
  return (
    <Card className="border-white/10 bg-[#111114]/90">
      <CardHeader className="pb-4"><CardDescription>Your rider</CardDescription></CardHeader>
      <CardContent className="flex items-center gap-3">
        <Avatar name={person.name} avatarUrl={person.avatarUrl} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-white">{person.name}</p>
          <p className="mt-1 text-xs text-zinc-500">Ride passenger</p>
        </div>
        <a
          href={`tel:${encodeURIComponent(person.phone)}`}
          aria-label={`Call rider ${person.name}`}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10 text-emerald-300 transition hover:bg-emerald-400/20"
        >
          <Phone aria-hidden="true" className="h-4 w-4" />
        </a>
      </CardContent>
    </Card>
  );
}

function Avatar({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  const [imageFailed, setImageFailed] = useState(false);

  return avatarUrl && !imageFailed ? (
    <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-white/10">
      <Image
        src={avatarUrl}
        alt=""
        fill
        sizes="48px"
        unoptimized
        className="object-cover"
        onError={() => setImageFailed(true)}
      />
    </span>
  ) : (
    <span aria-label={`${name} avatar`} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-red-500/25 to-zinc-800 text-red-200">
      {name.trim() ? name.trim().charAt(0).toUpperCase() : <UserRound aria-hidden="true" className="h-5 w-5" />}
    </span>
  );
}

function AddressSummary({ label, address, icon }: { label: string; address: string; icon: ReactNode }) {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-xl border border-white/[0.07] bg-black/20 p-3.5">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</p>
        <p className="mt-1 text-sm leading-5 text-zinc-200">{address}</p>
      </div>
    </div>
  );
}

function ActionButton({ loading, onClick, children }: { loading: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <Button className="gradient-red w-full text-white hover:brightness-110" onClick={onClick} disabled={loading}>
      {loading ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Route aria-hidden="true" className="h-4 w-4" />}
      {children}
    </Button>
  );
}

function SuccessState({ title, description }: { title: string; description: string }) {
  return (
    <div className="text-center">
      <motion.span
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 14 }}
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
      >
        <CheckCircle2 aria-hidden="true" className="h-7 w-7" />
      </motion.span>
      <h2 className="mt-4 font-display text-lg font-semibold text-white">{title}</h2>
      <p className="mt-1 text-sm leading-5 text-zinc-400">{description}</p>
    </div>
  );
}

const statusHeadline = (status: RideStatus, isDriver: boolean): string => {
  switch (status) {
    case "REQUESTED": return "Finding your driver";
    case "ACCEPTED": return isDriver ? "Head to the pickup" : "Your driver is on the way";
    case "ARRIVED": return isDriver ? "You’ve arrived" : "Your driver has arrived";
    case "IN_PROGRESS": return "Enjoy the ride";
    case "COMPLETED": return "You’ve reached your destination";
    case "CANCELLED": return "Ride cancelled";
  }
};

export default function RideDetailsPage() {
  const params = useParams<{ id: string }>();
  return (
    <ProtectedRoute>
      <RidePageContent rideId={params.id} />
    </ProtectedRoute>
  );
}
