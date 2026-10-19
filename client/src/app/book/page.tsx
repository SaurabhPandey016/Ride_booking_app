import { BookingExperience } from "@/components/booking/booking-experience";
import { ProtectedRoute } from "@/components/shared/protected-route";

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
  return (
    <ProtectedRoute role="RIDER">
      <BookingExperience
        initialPickup={firstParam(searchParams.pickup)}
        initialDrop={firstParam(searchParams.drop)}
      />
    </ProtectedRoute>
  );
}
