import Link from "next/link";
import { ArrowRight, MoveRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "./reveal";

export function FinalCta() {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-8 lg:px-10 lg:pb-28">
      <Reveal>
        <div className="relative isolate overflow-hidden rounded-3xl border border-white/[0.08] bg-[#111114] px-6 py-12 text-center sm:px-12 sm:py-16">
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_120%,rgba(220,38,38,0.3),transparent_62%)]" />
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-300">
            <MoveRight aria-hidden="true" className="h-5 w-5" />
          </div>
          <h2 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Make your next trip the easy part.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-zinc-400 sm:text-base sm:leading-7">
            Wherever the day takes you, RideX is ready to help you get there.
          </p>
          <Button asChild size="lg" className="gradient-red mt-7 min-h-12 rounded-full px-7 text-white hover:brightness-110">
            <Link href="/book">Get moving <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </Reveal>
    </section>
  );
}
