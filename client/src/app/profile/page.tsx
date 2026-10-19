"use client";

import Link from "next/link";
import { ProtectedRoute } from "@/components/shared/protected-route";
import { useAuth } from "@/hooks/use-auth";
import { BrandMark } from "@/components/layout/brand-mark";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfilePage() {
  const { user } = useAuth();
  return (
    <ProtectedRoute>
      <main className="mx-auto min-h-[60vh] max-w-4xl px-5 py-12 sm:px-8">
        <BrandMark />
        <h1 className="mt-12 font-display text-3xl font-bold">Your profile</h1>
        {user ? (
          <Card className="mt-7 max-w-xl">
            <CardHeader><CardTitle>{user.name}</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm text-zinc-300">
              <p>{user.email}</p>
              <p>{user.phone}</p>
              <p className="text-zinc-500">Account type: {user.role.toLowerCase()}</p>
              <Link className="inline-flex text-red-300 hover:text-red-200" href={user.role === "DRIVER" ? "/driver" : "/rider"}>
                Go to your RideX home
              </Link>
            </CardContent>
          </Card>
        ) : null}
      </main>
    </ProtectedRoute>
  );
}
