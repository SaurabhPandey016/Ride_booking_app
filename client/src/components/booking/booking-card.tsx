import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function BookingCard() {
  return (
    <Card className="mt-8 max-w-xl">
      <CardHeader>
        <CardTitle>Booking is coming together</CardTitle>
        <CardDescription>Your rider workspace is ready for the booking flow.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <Link href="/"><ArrowRight aria-hidden="true" className="mr-2 h-4 w-4" /> Explore RideX</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
