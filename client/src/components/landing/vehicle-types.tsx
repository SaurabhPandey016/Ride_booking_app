import { ArrowUpRight, Bike, Car, CarFront, Crown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

const vehicles: Array<{
  name: string;
  description: string;
  icon: LucideIcon;
  detail: string;
}> = [
  { name: "Bike", description: "A nimble ride through busy streets.", icon: Bike, detail: "Quick city hops" },
  { name: "Auto", description: "Everyday comfort, right around the corner.", icon: CarFront, detail: "Your daily go-to" },
  { name: "Cab", description: "Room to settle in and get there.", icon: Car, detail: "Comfortable journeys" },
  { name: "Premium", description: "A little more room for the occasion.", icon: Crown, detail: "Travel in style" },
];

export function VehicleTypes() {
  return (
    <section className="border-y border-white/[0.06] bg-white/[0.015]">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
        <Reveal>
          <SectionHeading
            eyebrow="Find your fit"
            title="The right ride for the moment."
            description="From quick city hops to a little extra comfort, choose the way you want to move."
          />
        </Reveal>
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {vehicles.map(({ name, description, icon: Icon, detail }, index) => (
            <Reveal key={name} delay={index * 0.06}>
              <article className="group relative flex h-full min-h-56 flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111114] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-red-500/40 hover:shadow-[0_18px_48px_rgba(239,68,68,0.12)] sm:min-h-64 sm:p-6">
                <div aria-hidden="true" className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-red-500/[0.06] blur-2xl transition-colors group-hover:bg-red-500/[0.16]" />
                <div className="relative flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/[0.08] text-red-300">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <ArrowUpRight aria-hidden="true" className="h-4 w-4 text-zinc-600 transition-colors group-hover:text-red-300" />
                </div>
                <div className="relative mt-auto pt-8">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-red-300 sm:text-xs">{detail}</p>
                  <h3 className="mt-2 font-display text-xl font-semibold text-white sm:text-2xl">{name}</h3>
                  <p className="mt-2 text-xs leading-5 text-zinc-400 sm:text-sm">{description}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
