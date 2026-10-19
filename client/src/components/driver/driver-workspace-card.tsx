import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function DriverWorkspaceCard() {
  return (
    <Card className="mt-8 max-w-xl">
      <CardHeader>
        <CardTitle>Your driver workspace</CardTitle>
        <CardDescription>Protected driver tools and ride requests will live here.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline"><Link href="/">Back to RideX</Link></Button>
      </CardContent>
    </Card>
  );
}
