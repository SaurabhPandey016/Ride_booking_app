"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import type { UserRole } from "@/types/auth";
import { PageSkeleton } from "@/components/shared/page-skeleton";

type ProtectedRouteProps = {
  children: ReactNode;
  role?: UserRole;
};

export function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const authError = useAuthStore((state) => state.authError);

  useEffect(() => {
    if (!isLoading && !authError && !user) {
      router.replace("/auth");
    } else if (!isLoading && user && role && user.role !== role) {
      router.replace(user.role === "DRIVER" ? "/driver" : "/rider");
    }
  }, [authError, isLoading, role, router, user]);

  if (authError) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-6 text-center">
        <h1 className="font-display text-2xl font-semibold">We couldn&apos;t verify your session</h1>
        <p className="mt-3 text-sm text-muted-foreground">{authError}</p>
        <a className="mt-6 text-sm font-medium text-red-400 hover:text-red-300" href="/auth">
          Return to sign in
        </a>
      </main>
    );
  }

  if (isLoading || !user || (role !== undefined && user.role !== role)) {
    return <PageSkeleton />;
  }

  return children;
}
