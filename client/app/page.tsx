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
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <header className="mb-10 flex items-center justify-between rounded-full border border-white/10 bg-slate-950/60 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/20 text-lg font-bold text-red-400">R</div>
          <div>
            <p className="text-lg font-semibold tracking-tight">RideX</p>
          </div>
        </div>
        <nav className="hidden items-center gap-8 text-sm text-zinc-300 md:flex">
          <a href="#features" className="hover:text-white">Features</a>
          <a href="#security" className="hover:text-white">Security</a>
          <a href="#pricing" className="hover:text-white">Pricing</a>
        </nav>
        <button className="rounded-full bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-400">Get Started</button>
      </header>

      <section className="grid items-center gap-8 py-8 lg:grid-cols-[1.2fr_0.8fr] lg:py-16">
        <div>
          <p className="mb-4 inline-flex rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-red-300">
            Smart mobility reimagined
          </p>
          <h1 className="max-w-xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            Move people and goods with fewer delays.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-zinc-300">
            RideX orchestrates drivers, passengers, and logistics in real time so every trip feels instant, safe, and dependable.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button className="rounded-full bg-red-500 px-5 py-3 font-semibold text-white hover:bg-red-400">Book a ride</button>
            <button className="rounded-full border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white hover:bg-white/10">See platform</button>
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

        <div className="glass-panel p-5">
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
          {features.map((feature) => (
            <article key={feature.title} className="glass-panel p-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/15 text-lg font-bold text-red-300">✦</div>
              <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-300">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
