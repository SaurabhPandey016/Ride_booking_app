export function PageSkeleton({ cards = 2 }: { cards?: number }) {
  return (
    <section
      className="mx-auto min-h-[60vh] max-w-6xl animate-pulse px-4 py-8 sm:px-6 lg:px-8"
      aria-label="Loading page"
      role="status"
      aria-busy="true"
    >
      <div className="h-3 w-28 rounded bg-white/[0.07]" />
      <div className="mt-4 h-9 w-64 max-w-full rounded-lg bg-white/[0.08]" />
      <div className="mt-3 h-4 w-80 max-w-full rounded bg-white/[0.05]" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {Array.from({ length: cards }, (_, index) => (
          <div key={index} className="space-y-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
            <div className="h-5 w-2/5 rounded bg-white/[0.07]" />
            <div className="h-16 rounded-xl bg-white/[0.045]" />
            <div className="h-4 w-3/4 rounded bg-white/[0.05]" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading content…</span>
    </section>
  );
}
