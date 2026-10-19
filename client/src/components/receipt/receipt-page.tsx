"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle, Printer, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProtectedRoute } from "@/components/shared/protected-route";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { api, normalizeApiError } from "@/lib/api";
import { formatAmount, formatDateTime } from "@/lib/format";

type CurrencyCode = "INR" | "USD";
type Receipt = {
  receiptNumber: string;
  date: string;
  rider: { name: string; email: string; phone: string };
  driver: {
    name: string;
    phone: string;
    vehicle: { vehicleType: string; vehicleModel: string; vehicleNumber: string };
  };
  pickup: { address: string };
  drop: { address: string };
  distanceKm: number;
  durationMin: number;
  fareBreakdown: {
    currency: "INR";
    basePaise: number;
    distancePaise: number;
    timePaise: number;
    adjustmentPaise: number;
    taxesPaise: number;
    totalPaise: number;
  };
  payment: {
    currency: CurrencyCode;
    totalMinor: number;
    totalAmount: string;
    status: "PENDING" | "SUCCEEDED" | "FAILED";
  };
};
type ReceiptResponse = { data: { receipt: Receipt } };

function PrintableReceipt({ receipt }: { receipt: Receipt }) {
  const toPaidCurrency = (amountPaise: number) => {
    const inrAmount = amountPaise / 100;
    const paidMajor = receipt.payment.currency === "INR"
      ? inrAmount
      : Number(receipt.payment.totalAmount) * (inrAmount / (receipt.fareBreakdown.totalPaise / 100));
    return formatAmount(paidMajor, receipt.payment.currency);
  };

  return (
    <article className="receipt-paper overflow-hidden rounded-2xl border border-white/10 bg-[#111114] shadow-2xl">
      <div className="h-1.5 bg-gradient-to-r from-red-500 via-red-600 to-red-900 print:hidden" />
      <div className="p-6 sm:p-10">
        <header className="flex flex-wrap items-start justify-between gap-5 border-b border-white/10 pb-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-red-300">RideX · Payment receipt</p>
            <h1 className="mt-3 font-display text-3xl font-bold text-white">Ride receipt</h1>
            <p className="mt-2 text-sm text-zinc-400">Thank you for riding with RideX.</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-[10px] uppercase tracking-wider text-zinc-500">Receipt number</p>
            <p className="mt-1 font-mono text-sm font-semibold text-white">{receipt.receiptNumber}</p>
            <p className="mt-3 text-xs text-zinc-400">{formatDateTime(receipt.date)}</p>
          </div>
        </header>

        <section className="grid gap-6 border-b border-white/10 py-7 sm:grid-cols-2">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Passenger</h2>
            <p className="mt-2 text-sm font-semibold text-white">{receipt.rider.name}</p>
            <p className="mt-1 break-all text-xs text-zinc-400">{receipt.rider.email}</p>
            <p className="mt-1 text-xs text-zinc-400">{receipt.rider.phone}</p>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Driver & vehicle</h2>
            <p className="mt-2 text-sm font-semibold text-white">{receipt.driver.name}</p>
            <p className="mt-1 text-xs text-zinc-400">{receipt.driver.vehicle.vehicleType} · {receipt.driver.vehicle.vehicleModel}</p>
            <p className="mt-1 font-mono text-xs text-zinc-400">{receipt.driver.vehicle.vehicleNumber}</p>
          </div>
        </section>

        <section className="grid gap-4 border-b border-white/10 py-7 sm:grid-cols-2">
          <ReceiptField label="Pickup" value={receipt.pickup.address} />
          <ReceiptField label="Drop-off" value={receipt.drop.address} />
          <ReceiptField label="Distance" value={`${receipt.distanceKm.toFixed(1)} km`} />
          <ReceiptField label="Duration" value={`${receipt.durationMin} minutes`} />
        </section>

        <section className="py-7">
          <h2 className="font-display text-lg font-semibold text-white">Fare breakdown</h2>
          <div className="mt-4 space-y-3">
            <FareRow label="Base fare" value={toPaidCurrency(receipt.fareBreakdown.basePaise)} />
            <FareRow label="Distance" value={toPaidCurrency(receipt.fareBreakdown.distancePaise)} />
            <FareRow label="Time" value={toPaidCurrency(receipt.fareBreakdown.timePaise)} />
            {receipt.fareBreakdown.adjustmentPaise !== 0 && <FareRow label="Fare adjustment" value={toPaidCurrency(receipt.fareBreakdown.adjustmentPaise)} />}
            {receipt.fareBreakdown.taxesPaise !== 0 && <FareRow label="Taxes" value={toPaidCurrency(receipt.fareBreakdown.taxesPaise)} />}
          </div>
        </section>

        <section className="flex flex-wrap items-end justify-between gap-4 border-t border-white/10 pt-5">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Payment status</h2>
            <p className={`mt-2 text-sm font-semibold ${receipt.payment.status === "SUCCEEDED" ? "text-emerald-300" : receipt.payment.status === "FAILED" ? "text-red-300" : "text-amber-300"}`}>
              {receipt.payment.status}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500">Total paid ({receipt.payment.currency})</p>
            <p className="mt-1 font-display text-3xl font-bold text-white">
              {formatAmount(Number(receipt.payment.totalAmount), receipt.payment.currency)}
            </p>
          </div>
        </section>
        <footer className="mt-8 border-t border-dashed border-white/10 pt-5 text-center text-[11px] text-zinc-500">
          This receipt was generated by RideX. For help, contact developersaurabh001@gmail.com.
        </footer>
      </div>
    </article>
  );
}

function ReceiptField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-1 text-sm leading-6 text-zinc-200">{value}</p>
    </div>
  );
}

function FareRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-zinc-400">{label}</span>
      <span className="font-medium text-zinc-200">{value}</span>
    </div>
  );
}

function ReceiptContent({ rideId }: { rideId: string }) {
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReceipt = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<ReceiptResponse>(`/receipts/${encodeURIComponent(rideId)}`);
      setReceipt(response.data.data.receipt);
    } catch (requestError: unknown) {
      setError(normalizeApiError(requestError).message);
    } finally {
      setLoading(false);
    }
  }, [rideId]);

  useEffect(() => {
    void loadReceipt();
  }, [loadReceipt]);

  return (
    <main className="receipt-page mx-auto min-h-[65vh] max-w-4xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <div className="mb-5 flex items-center justify-between gap-3 print:hidden">
        <Button asChild variant="ghost" className="text-zinc-400 hover:text-white">
          <Link href={`/history/${encodeURIComponent(rideId)}`}><ArrowLeft aria-hidden="true" className="h-4 w-4" />Back to trip</Link>
        </Button>
        <Button onClick={() => window.print()} disabled={!receipt} className="gradient-red text-white">
          <Printer aria-hidden="true" className="h-4 w-4" />Download / Print receipt
        </Button>
      </div>

      {loading ? (
        <PageSkeleton cards={1} />
      ) : error || !receipt ? (
        <Card className="border-white/10 bg-[#111114]/90 print:hidden">
          <CardHeader>
            <AlertCircle aria-hidden="true" className="mb-2 h-6 w-6 text-amber-300" />
            <CardTitle>Receipt unavailable</CardTitle>
            <CardDescription>{error ?? "A receipt could not be found for this ride."}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => void loadReceipt()}><RotateCw aria-hidden="true" className="h-4 w-4" />Try again</Button>
            <Button asChild><Link href={`/history/${encodeURIComponent(rideId)}`}>View trip details</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <PrintableReceipt receipt={receipt} />
      )}
    </main>
  );
}

export function ReceiptPage({ rideId }: { rideId: string }) {
  return (
    <ProtectedRoute>
      <ReceiptContent rideId={rideId} />
    </ProtectedRoute>
  );
}
