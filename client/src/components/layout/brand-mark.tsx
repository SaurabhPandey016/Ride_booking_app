import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-3", className)}>
      <span className="gradient-red glow-red flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white">
        R
      </span>
      <span className="font-display text-lg font-semibold tracking-tight">RideX</span>
    </Link>
  );
}
