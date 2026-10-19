import { ProtectedRoute } from "@/components/shared/protected-route";
import { BrandMark } from "@/components/layout/brand-mark";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DriverEarningsPage() {
  return (
    <ProtectedRoute role="DRIVER">
      <main className="mx-auto min-h-[60vh] max-w-5xl px-5 py-12 sm:px-8">
        <BrandMark />
        <h1 className="mt-12 font-display text-3xl font-bold">Earnings</h1>
        <Card className="mt-7 max-w-xl">
          <CardHeader>
            <CardTitle>Your earnings overview</CardTitle>
            <CardDescription>Completed, paid trips and payout details will appear here.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            This page is ready for your driver earnings dashboard.
          </CardContent>
        </Card>
      </main>
    </ProtectedRoute>
  );
}
