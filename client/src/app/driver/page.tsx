import { ProtectedRoute } from "@/components/shared/protected-route";
import { BrandMark } from "@/components/layout/brand-mark";
import { DriverWorkspaceCard } from "@/components/driver/driver-workspace-card";

export default function DriverHomePage() {
  return (
    <ProtectedRoute role="DRIVER">
      <main className="mx-auto min-h-screen max-w-5xl px-5 py-8 sm:px-8">
        <BrandMark />
        <section className="mt-14">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-300">Driver space</p>
          <h1 className="mt-3 font-display text-4xl font-bold">Ready when you are.</h1>
          <DriverWorkspaceCard />
        </section>
      </main>
    </ProtectedRoute>
  );
}
