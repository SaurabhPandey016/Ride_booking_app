"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowRight, MapPin, Navigation, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useReducedMotion } from "framer-motion";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyToggle } from "@/components/shared/currency-toggle";
import { cn } from "@/lib/utils";

export function HeroSection() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const reduceMotion = useReducedMotion();
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");

  useEffect(() => {
    if (user && !pickup) {
      setPickup("Current location");
    }
  }, [pickup, user]);

  const openBooking = () => {
    const params = new URLSearchParams();
    if (pickup.trim()) params.set("pickup", pickup.trim());
    if (drop.trim()) params.set("drop", drop.trim());
    router.push(`/book${params.size ? `?${params.toString()}` : ""}`);
    if (!user) {
      toast.info("Sign in to save your ride details.");
    }
  };

  return (
    <section className="relative isolate overflow-hidden border-b border-white/[0.06]">
      <div aria-hidden="true" className="hero-grid pointer-events-none absolute inset-0 -z-10" />
      <div
        aria-hidden="true"
        className={cn(
          "hero-glow pointer-events-none absolute -top-52 left-1/2 -z-10 h-[34rem] w-[50rem] -translate-x-1/2 rounded-full",
          !reduceMotion && "animate-glow-drift",
        )}
      />
      <div className="mx-auto grid min-h-[calc(100svh-4.5rem)] max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:px-10 lg:py-24">
        <div className="relative z-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-500/25 bg-red-500/[0.08] px-3.5 py-2 text-xs font-medium text-red-200 sm:text-sm">
            <Sparkles aria-hidden="true" className="h-4 w-4" />
            The city moves. So do you.
          </div>
          <h1 className="max-w-3xl font-display text-[2.7rem] font-bold leading-[1.04] tracking-[-0.045em] text-white sm:text-6xl lg:text-[4.5rem] xl:text-[5rem]">
            Move across the city,{" "}
            <span className="gradient-text">effortlessly.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-zinc-300 sm:text-lg sm:leading-8">
            Your plans don&apos;t wait for traffic. Get a ride that fits your day, with clear fares and a driver you can follow every step of the way.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button
              size="lg"
              className="gradient-red min-h-12 rounded-full px-6 text-white shadow-[0_10px_34px_rgba(239,68,68,0.2)] hover:brightness-110"
              onClick={openBooking}
            >
              Book a ride <ArrowRight aria-hidden="true" className="ml-1 h-4 w-4" />
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="min-h-12 rounded-full border-white/10 bg-white/[0.03] px-6 text-white hover:bg-white/[0.07]"
            >
              <a href="/driver">
                Become a driver <ArrowDown aria-hidden="true" className="ml-1 h-4 w-4 -rotate-45" />
              </a>
            </Button>
          </div>
          <div className="mt-7 flex items-center gap-3 text-xs text-zinc-500 sm:text-sm">
            <span className="flex -space-x-2" aria-hidden="true">
              <span className="h-7 w-7 rounded-full border-2 border-zinc-950 bg-gradient-to-br from-orange-300 to-red-500" />
              <span className="h-7 w-7 rounded-full border-2 border-zinc-950 bg-gradient-to-br from-violet-300 to-fuchsia-600" />
              <span className="h-7 w-7 rounded-full border-2 border-zinc-950 bg-gradient-to-br from-cyan-300 to-blue-600" />
            </span>
            <span><strong className="font-semibold text-zinc-300">A smoother ride</strong> starts with a few taps</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[34rem] lg:ml-auto">
          <div
            aria-hidden="true"
            className={cn(
              "absolute -inset-6 rounded-[2rem] bg-red-600/[0.12] blur-3xl",
              !reduceMotion && "animate-pulse-slow",
            )}
          />
          <Card className="relative overflow-hidden rounded-[1.6rem] border-white/10 bg-[#111114]/90 p-5 shadow-[0_30px_100px_rgba(0,0,0,0.42)] backdrop-blur-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-300">Plan your next trip</p>
                <h2 className="mt-2 font-display text-xl font-semibold text-white sm:text-2xl">Where are we going?</h2>
              </div>
              <CurrencyToggle />
            </div>
            <div className="relative mt-7 space-y-4">
              <div aria-hidden="true" className="absolute left-[1.05rem] top-11 h-[3.35rem] border-l border-dashed border-red-500/40" />
              <div className="space-y-2">
                <Label htmlFor="hero-pickup" className="text-xs text-zinc-400">Pickup</Label>
                <div className="relative">
                  <MapPin aria-hidden="true" className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-red-300" />
                  <Input
                    id="hero-pickup"
                    autoComplete="street-address"
                    value={pickup}
                    onChange={(event) => setPickup(event.target.value)}
                    onKeyDown={(event) => event.key === "Enter" && openBooking()}
                    placeholder={user ? "Current location" : "Enter pickup location"}
                    className="h-12 border-white/10 bg-white/[0.035] pl-11 placeholder:text-zinc-600"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hero-drop" className="text-xs text-zinc-400">Drop-off</Label>
                <div className="relative">
                  <Navigation aria-hidden="true" className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <Input
                    id="hero-drop"
                    autoComplete="off"
                    value={drop}
                    onChange={(event) => setDrop(event.target.value)}
                    onKeyDown={(event) => event.key === "Enter" && openBooking()}
                    placeholder="Where to?"
                    className="h-12 border-white/10 bg-white/[0.035] pl-11 placeholder:text-zinc-600"
                  />
                </div>
              </div>
              <Button
                onClick={openBooking}
                className="gradient-red h-12 w-full rounded-xl text-sm font-semibold text-white hover:brightness-110"
              >
                <Search aria-hidden="true" className="mr-2 h-4 w-4" /> Search rides
              </Button>
              <p className="text-center text-[11px] text-zinc-500">
                {user ? `Welcome back, ${user.name.split(" ")[0]}. Your trip details will be carried over.` : "Sign in to save a pickup and continue booking."}
              </p>
            </div>
            <div aria-hidden="true" className="absolute -right-16 -top-16 h-40 w-40 rounded-full border border-red-500/10" />
            <div aria-hidden="true" className="absolute -right-8 -top-8 h-24 w-24 rounded-full border border-red-500/[0.08]" />
          </Card>
          <div className="glass absolute -bottom-5 -left-3 hidden items-center gap-3 rounded-xl px-4 py-3 shadow-xl sm:flex">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300">
              <MapPin aria-hidden="true" className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-semibold text-white">Ride updates, live</p>
              <p className="mt-0.5 text-[11px] text-zinc-500">Stay in the know, all the way</p>
            </div>
          </div>
        </div>
      </div>
      <div className="mx-auto hidden max-w-7xl px-10 pb-6 lg:block">
        <a href="#live-stats" className="inline-flex items-center gap-2 text-xs text-zinc-500 transition-colors hover:text-zinc-300">
          Explore the RideX experience <ArrowDown aria-hidden="true" className="h-3.5 w-3.5" />
        </a>
      </div>
    </section>
  );
}
