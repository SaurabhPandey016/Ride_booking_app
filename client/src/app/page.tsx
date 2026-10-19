import { ArrowRight, CarFront, Clock3, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CurrencyToggle } from "@/components/shared/currency-toggle";
import { BrandMark } from "@/components/layout/brand-mark";
import { FeatureCard } from "@/components/landing/feature-card";

const stats = [
  { label: 'Daily rides', value: '24.8K' },
  { label: 'Avg. ETA', value: '4.1 min' },
  { label: 'Trip rating', value: '4.9/5' },
];

const features = [
  {
    title: 'Realtime dispatch',
    description: 'Match riders to the closest driver and optimize wait times automatically.',
  },
  {
    title: 'Dynamic pricing',
    description: 'Adjust rates based on route demand, traffic, and rider priority windows.',
  },
  {
    title: 'Fleet intelligence',
    description: 'Monitor driver health, vehicle status, and route efficiency from a single dashboard.',
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col px-5 pb-16 pt-6 sm:px-8 lg:px-10">
      <header className="glass mb-12 flex items-center justify-between rounded-full px-4 py-3">
        <BrandMark />
        <nav className="hidden items-center gap-8 text-sm text-zinc-300 md:flex">
          <a href="#features" className="hover:text-white">Features</a>
          <a href="#security" className="hover:text-white">Security</a>
          <a href="#pricing" className="hover:text-white">Pricing</a>
        </nav>
        <div className="flex items-center gap-2">
          <CurrencyToggle />
          <Button asChild size="sm" className="rounded-full px-5">
            <Link href="/auth">Get started <ArrowRight aria-hidden="true" className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
      </header>

      <section className="grid items-center gap-8 py-8 lg:grid-cols-[1.2fr_0.8fr] lg:py-16">
        <div>
          <Badge variant="outline" className="mb-5 gap-2 rounded-full border-red-500/30 bg-red-500/10 px-3 py-1 text-red-200">
            <Sparkles aria-hidden="true" className="h-3.5 w-3.5" /> Smart mobility reimagined
          </Badge>
          <h1 className="max-w-xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            Every journey, <span className="gradient-text">better connected.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-zinc-300">
            A more reliable way to get there. Book a ride, follow your driver in real time, and move through your day with confidence.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button asChild size="lg" className="rounded-full px-6">
              <Link href="/auth">Book a ride <ArrowRight aria-hidden="true" className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full border-white/10 bg-white/[0.03] px-6">
              <a href="#features">Explore RideX</a>
            </Button>
          </div>
          <div className="mt-10 grid max-w-lg grid-cols-3 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="glass-panel px-4 py-4">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="mt-2 text-xs uppercase tracking-wide text-zinc-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel glow-red p-5">
          <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4">
            <div className="flex items-center justify-between text-sm text-zinc-300">
              <span>Active trip</span>
              <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-xs font-medium text-emerald-300">On route</span>
            </div>
            <div className="mt-6 space-y-5">
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-red-300">Pickup</p>
                <p className="mt-2 text-xl font-semibold text-white">Aundh, Pune</p>
                <p className="mt-1 text-sm text-zinc-300">Arrives in 3 min</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Destination</p>
                <p className="mt-2 text-xl font-semibold text-white">Baner, Pune</p>
                <p className="mt-1 text-sm text-zinc-300">12.4 km • 17 min</p>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-zinc-200">
              <span>Driver score</span>
              <span className="font-semibold text-white">98.6%</span>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-12">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.28em] text-red-300">Platform capabilities</p>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Built for high-frequency mobility teams</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              icon={
                index === 0 ? (
                  <Clock3 aria-hidden="true" />
                ) : index === 1 ? (
                  <CarFront aria-hidden="true" />
                ) : (
                  <ShieldCheck aria-hidden="true" />
                )
              }
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </section>

      <footer className="mt-auto flex flex-col justify-between gap-3 border-t border-white/[0.08] pt-6 text-sm text-zinc-500 sm:flex-row">
        <span>© {new Date().getFullYear()} RideX. Move with confidence.</span>
        <span className="flex items-center gap-2"><ShieldCheck aria-hidden="true" className="h-4 w-4 text-red-400" /> Every ride starts with trust.</span>
      </footer>
    </main>
  );
}
