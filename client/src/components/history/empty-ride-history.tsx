import { History } from "lucide-react";

export function EmptyRideHistory() {
  return (
    <div className="glass flex flex-col items-center rounded-2xl px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-zinc-400">
        <History aria-hidden="true" className="h-5 w-5" />
      </span>
      <h2 className="mt-4 font-display text-lg font-semibold">Your ride history will show up here</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Completed trips and receipts are easy to find once you take your first RideX journey.
      </p>
    </div>
  );
}
