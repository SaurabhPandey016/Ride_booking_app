import { CarFront, MapPinned, Star, type LucideIcon } from "lucide-react";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

const steps: Array<{ title: string; description: string; icon: LucideIcon; number: string }> = [
  {
    number: "01",
    title: "Request",
    description: "Set your pickup and destination. Choose the ride that fits your plans.",
    icon: MapPinned,
  },
  {
    number: "02",
    title: "Ride",
    description: "Meet your driver and follow your trip as it moves across the city.",
    icon: CarFront,
  },
  {
    number: "03",
    title: "Pay & rate",
    description: "Pay securely, get your receipt, and share how the ride went.",
    icon: Star,
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
      <Reveal>
        <SectionHeading
          eyebrow="Simple from start to finish"
          title="A better ride in three steps."
          description="Everything you need to get moving, without the guesswork."
        />
      </Reveal>
      <div className="relative grid gap-5 md:grid-cols-3 md:gap-7">
        <div aria-hidden="true" className="step-connector absolute left-[17%] right-[17%] top-9 hidden h-px md:block" />
        {steps.map(({ title, description, icon: Icon, number }, index) => (
          <Reveal key={title} delay={index * 0.08} className="relative">
            <article className="glass h-full rounded-2xl p-6 sm:p-7">
              <div className="relative z-10 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-2xl border border-red-500/25 bg-[#151113] text-red-300 shadow-[0_0_28px_rgba(239,68,68,0.12)]">
                <Icon aria-hidden="true" className="h-6 w-6" />
              </div>
              <p className="mt-7 text-xs font-semibold tracking-[0.2em] text-red-300">{number}</p>
              <h3 className="mt-2 font-display text-xl font-semibold text-white">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-400">{description}</p>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
