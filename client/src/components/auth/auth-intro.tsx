"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, CarFront, Check, ShieldCheck, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const benefits = [
  "Know your fare before you ride",
  "Follow every trip in real time",
  "Pay securely and keep every receipt",
];

export function AuthIntro() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative hidden min-h-[640px] flex-col justify-between overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-red-950 via-[#190b10] to-zinc-950 p-9 shadow-2xl shadow-red-950/20 lg:flex xl:p-12">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-28 -top-24 h-80 w-80 rounded-full bg-red-600/25 blur-[90px]" />
        <div className="absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-orange-700/15 blur-[100px]" />
        <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent_90%)]" />
        <motion.div
          animate={reduceMotion ? undefined : { y: [0, -12, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-16 top-28 h-24 w-24 rounded-3xl border border-white/10 bg-white/[0.035] backdrop-blur-sm"
        />
        <motion.div
          animate={reduceMotion ? undefined : { y: [0, 14, 0], rotate: [0, -7, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
          className="absolute bottom-40 right-24 h-14 w-14 rounded-full border border-red-300/20 bg-red-500/10"
        />
      </div>

      <div className="relative z-10">
        <Button asChild variant="ghost" className="-ml-3 text-zinc-300 hover:text-white">
          <Link href="/">
            <ArrowLeft aria-hidden="true" className="mr-2 h-4 w-4" />
            Back home
          </Link>
        </Button>
      </div>

      <div className="relative z-10 py-10">
        <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-400 via-red-600 to-red-900 shadow-lg shadow-red-950/60">
          <CarFront aria-hidden="true" className="h-7 w-7 text-white" />
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-red-300">Your city, in motion</p>
        <h1 className="mt-4 max-w-lg font-display text-5xl font-bold leading-[1.08] tracking-tight xl:text-6xl">
          Every journey starts with <span className="gradient-text">RideX.</span>
        </h1>
        <p className="mt-5 max-w-md text-base leading-7 text-zinc-300/75">
          Find a ride, follow the route, and get there with confidence. Your next trip is just a few taps away.
        </p>

        <ul className="mt-8 space-y-4">
          {benefits.map((benefit) => (
            <li key={benefit} className="flex items-center gap-3 text-sm text-zinc-200/90">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-red-400/25 bg-red-500/10 text-red-300">
                <Check aria-hidden="true" className="h-3.5 w-3.5" />
              </span>
              {benefit}
            </li>
          ))}
        </ul>
      </div>

      <div className="glass relative z-10 rounded-2xl border-white/10 bg-black/20 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-1 text-amber-300">
            {Array.from({ length: 5 }, (_, index) => (
              <Star key={index} aria-hidden="true" className="h-3.5 w-3.5 fill-current" />
            ))}
          </div>
          <Sparkles aria-hidden="true" className="h-4 w-4 text-red-300/70" />
        </div>
        <blockquote className="mt-3 text-sm leading-6 text-zinc-200">
          “RideX makes getting around feel effortless. I love knowing what my ride will cost before I book.”
        </blockquote>
        <div className="mt-4 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-red-400/30 to-orange-500/20 text-xs font-semibold text-red-100">
            AP
          </span>
          <div>
            <p className="text-sm font-medium text-white">Aarav P.</p>
            <p className="text-xs text-zinc-500">RideX rider</p>
          </div>
          <ShieldCheck aria-hidden="true" className="ml-auto h-4 w-4 text-emerald-400/80" />
        </div>
      </div>
    </section>
  );
}
