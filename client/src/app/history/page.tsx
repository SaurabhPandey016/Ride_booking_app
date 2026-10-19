import { ProtectedRoute } from "@/components/shared/protected-route";
import { RideHistory } from "@/components/history/ride-history";

export default function RideHistoryPage() {
  return (
    <ProtectedRoute>
      <RideHistory />
    </ProtectedRoute>
  );
}
