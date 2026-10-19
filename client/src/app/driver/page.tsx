import { ProtectedRoute } from "@/components/shared/protected-route";
import { DriverDashboard } from "@/components/driver/driver-dashboard";

export default function DriverHomePage() {
  return (
    <ProtectedRoute role="DRIVER">
      <DriverDashboard />
    </ProtectedRoute>
  );
}
