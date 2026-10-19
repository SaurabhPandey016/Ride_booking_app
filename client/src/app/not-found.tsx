import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="gradient-text font-display text-7xl font-bold">404</p>
      <h1 className="mt-4 font-display text-2xl font-semibold">This destination isn&apos;t on the map.</h1>
      <p className="mt-2 text-sm text-muted-foreground">The page may have moved, or the link may be out of date.</p>
      <Button asChild variant="outline" className="mt-7 rounded-full">
        <Link href="/"><ArrowLeft aria-hidden="true" className="mr-2 h-4 w-4" /> Back to RideX</Link>
      </Button>
    </main>
  );
}
