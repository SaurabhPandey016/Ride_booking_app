import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-5 py-10 sm:px-8">
      <Skeleton className="h-12 w-40 rounded-full" />
      <section className="mt-20 grid gap-12 lg:grid-cols-2">
        <div className="space-y-5">
          <Skeleton className="h-8 w-56 rounded-full" />
          <Skeleton className="h-16 w-full max-w-xl" />
          <Skeleton className="h-6 w-full max-w-lg" />
          <Skeleton className="h-12 w-48 rounded-full" />
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </section>
    </main>
  );
}
