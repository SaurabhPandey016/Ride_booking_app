"use client";

import { useParams } from "next/navigation";
import { ReceiptPage } from "@/components/receipt/receipt-page";

export default function RideReceiptPage() {
  const params = useParams<{ rideId: string }>();
  return <ReceiptPage rideId={params.rideId} />;
}
