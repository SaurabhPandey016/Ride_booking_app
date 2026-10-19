import { ProtectedRoute } from "@/components/shared/protected-route";
import { CurrencyToggle } from "@/components/shared/currency-toggle";
import { BookingCard } from "@/components/booking/booking-card";
import { BrandMark } from "@/components/layout/brand-mark";

export default function RiderHomePage() {
  return (
    <ProtectedRoute role="RIDER">
      <main className="mx-auto min-h-screen max-w-5xl px-5 py-8 sm:px-8">
        <header className="flex items-center justify-between">
          <BrandMark />
          <CurrencyToggle />
        </header>
        <section className="mt-14">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-300">Rider space</p>
          <h1 className="mt-3 font-display text-4xl font-bold">Where to next?</h1>
          <BookingCard />
        </section>
      </main>
    </ProtectedRoute>
  );
}
