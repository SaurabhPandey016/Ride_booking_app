"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, MapPin, Navigation } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/auth-store";

export function BookingEntry({
  pickup: initialPickup,
  drop: initialDrop,
}: {
  pickup: string;
  drop: string;
}) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [pickup, setPickup] = useState(initialPickup || (user ? "Current location" : ""));
  const [drop, setDrop] = useState(initialDrop);

  const continueToSignIn = () => {
    const bookingQuery = new URLSearchParams();
    if (pickup.trim()) bookingQuery.set("pickup", pickup.trim());
    if (drop.trim()) bookingQuery.set("drop", drop.trim());
    const returnTo = `/book${bookingQuery.size ? `?${bookingQuery.toString()}` : ""}`;
    router.push(`/auth?next=${encodeURIComponent(returnTo)}`);
  };

  const continueToRider = () => {
    const bookingQuery = new URLSearchParams();
    if (pickup.trim()) bookingQuery.set("pickup", pickup.trim());
    if (drop.trim()) bookingQuery.set("drop", drop.trim());
    router.push(`/rider${bookingQuery.size ? `?${bookingQuery.toString()}` : ""}`);
  };

  return (
    <Card className="mt-8 max-w-xl border-white/10 bg-[#111114]/90 shadow-glow">
      <CardHeader>
        <CardTitle>Plan your ride</CardTitle>
        <CardDescription>
          {user
            ? "Your trip details are ready to continue."
            : "Add your route details. Sign in to continue booking."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="booking-pickup">Pickup</Label>
          <div className="relative">
            <MapPin aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-red-300" />
            <Input
              id="booking-pickup"
              value={pickup}
              onChange={(event) => setPickup(event.target.value)}
              placeholder="Enter pickup location"
              className="pl-10"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="booking-drop">Destination</Label>
          <div className="relative">
            <Navigation aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              id="booking-drop"
              value={drop}
              onChange={(event) => setDrop(event.target.value)}
              placeholder="Where to?"
              className="pl-10"
            />
          </div>
        </div>
        {user ? (
          <Button
            className="gradient-red min-h-11 w-full text-white hover:brightness-110"
            disabled={!pickup.trim() || !drop.trim()}
            onClick={continueToRider}
          >
            Continue to your rider space <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            className="gradient-red min-h-11 w-full text-white hover:brightness-110"
            disabled={!pickup.trim() || !drop.trim()}
            onClick={continueToSignIn}
          >
            Sign in to continue <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" />
          </Button>
        )}
        <p className="text-center text-xs text-zinc-500">
          {user ? (
            <>Want to browse first? <Link className="text-red-300 hover:text-red-200" href="/">Return home</Link>.</>
          ) : (
            <>New to RideX? <Link className="text-red-300 hover:text-red-200" href="/auth">Create an account</Link>.</>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
