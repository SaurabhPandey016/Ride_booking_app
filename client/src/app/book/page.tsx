import { BookingEntry } from "@/components/booking/booking-entry";
import { BrandMark } from "@/components/layout/brand-mark";

type BookingSearchParams = {
  pickup?: string | string[];
  drop?: string | string[];
};

const firstParam = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? value[0] ?? "" : value ?? "";

export default function BookPage({
  searchParams,
}: {
  searchParams: BookingSearchParams;
}) {
  const pickup = firstParam(searchParams.pickup);
  const drop = firstParam(searchParams.drop);

  return (
    <main className="mx-auto min-h-[65vh] max-w-5xl px-5 py-12 sm:px-8 lg:py-16">
      <BrandMark />
      <section className="mt-12">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-300">Start a journey</p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Let&apos;s get you there.
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-400 sm:text-base sm:leading-7">
          Review your pickup and destination, then continue to your RideX account.
        </p>
        <BookingEntry pickup={pickup} drop={drop} />
      </section>
    </main>
  );
}
