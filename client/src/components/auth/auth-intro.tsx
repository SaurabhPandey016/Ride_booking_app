import Link from "next/link";
import { ArrowLeft, CarFront } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AuthIntro() {
  return (
    <div className="hidden lg:block">
      <Button asChild variant="ghost" className="mb-10 -ml-4 text-zinc-400">
        <Link href="/">
          <ArrowLeft aria-hidden="true" className="mr-2 h-4 w-4" />
          Back home
        </Link>
      </Button>
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-red-300">Your next ride</p>
      <h1 className="mt-4 max-w-lg font-display text-5xl font-bold leading-tight">
        Starts with a <span className="gradient-text">better way.</span>
      </h1>
      <p className="mt-5 max-w-md leading-7 text-zinc-400">
        Sign in or create your account to book rides, track trips, and connect with trusted drivers.
      </p>
      <div className="glass mt-8 inline-flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-zinc-300">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/15 text-red-300">
          <CarFront aria-hidden="true" className="h-5 w-5" />
        </span>
        One account. A smoother journey.
      </div>
    </div>
  );
}
