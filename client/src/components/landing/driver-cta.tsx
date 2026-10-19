import Link from "next/link";
import { ArrowRight, Check, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "./reveal";

const benefits = ["Choose when you go online", "See ride details before accepting", "Track completed and paid trips"];

export function DriverCta() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
      <Reveal>
        <div className="relative isolate overflow-hidden rounded-[1.75rem] border border-red-300/15 bg-gradient-to-br from-red-600 via-red-700 to-[#4b1018] p-7 shadow-[0_24px_80px_rgba(127,29,29,0.25)] sm:p-10 lg:p-14">
          <div aria-hidden="true" className="absolute -right-24 -top-28 -z-10 h-80 w-80 rounded-full border border-white/10" />
          <div aria-hidden="true" className="absolute -right-6 -top-10 -z-10 h-48 w-48 rounded-full border border-white/[0.08]" />
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-red-50">
                <WalletCards aria-hidden="true" className="h-4 w-4" /> For drivers
              </div>
              <h2 className="mt-5 max-w-2xl font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Your next opportunity is around the corner.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-6 text-red-50/75 sm:text-base sm:leading-7">
                Join RideX, meet new riders, and make every trip work around your day.
              </p>
              <ul className="mt-6 grid gap-2 sm:grid-cols-3">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-2 text-xs text-red-50/90 sm:text-sm">
                    <Check aria-hidden="true" className="h-4 w-4 shrink-0" /> {benefit}
                  </li>
                ))}
              </ul>
            </div>
            <Button asChild size="lg" className="min-h-12 rounded-full bg-white px-6 font-semibold text-red-700 hover:bg-red-50">
              <Link href="/driver">Drive with RideX <ArrowRight aria-hidden="true" className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
