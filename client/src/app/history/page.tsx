import { EmptyRideHistory } from "@/components/history/empty-ride-history";
import { ProtectedRoute } from "@/components/shared/protected-route";
import { BrandMark } from "@/components/layout/brand-mark";

export default function RideHistoryPage() {
  return (
    <ProtectedRoute role="RIDER">
      <main className="mx-auto min-h-screen max-w-5xl px-5 py-8 sm:px-8">
        <BrandMark />
        <section className="mt-14">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-300">Your account</p>
          <h1 className="mb-8 mt-3 font-display text-4xl font-bold">Ride history</h1>
          <EmptyRideHistory />
        </section>
      </main>
    </ProtectedRoute>
  );
}
