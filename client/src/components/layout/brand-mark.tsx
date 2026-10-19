import Link from "next/link";
import { CarFront } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-3", className)}>
      <span className="gradient-red glow-red flex h-10 w-10 items-center justify-center rounded-xl text-white">
        <CarFront aria-hidden="true" className="h-5 w-5" />
      </span>
      <span className="font-display text-lg font-semibold tracking-tight">RideX</span>
    </Link>
  );
}
