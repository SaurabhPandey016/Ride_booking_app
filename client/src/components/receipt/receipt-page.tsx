"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDownToLine, ArrowLeft, AlertCircle, LoaderCircle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProtectedRoute } from "@/components/shared/protected-route";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { api, normalizeApiError } from "@/lib/api";
import { formatAmount, formatDateTime } from "@/lib/format";
import { toast } from "sonner";

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
  const [downloading, setDownloading] = useState(false);
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

  const downloadReceipt = async () => {
    if (!receipt) {
      return;
    }

    setDownloading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 18;
      const contentWidth = pageWidth - margin * 2;
      let y = 24;

      const ensureSpace = (height: number) => {
        if (y + height > 278) {
          pdf.addPage();
          y = 20;
        }
      };

      const addSection = (title: string) => {
        ensureSpace(14);
        y += 4;
        pdf.setDrawColor(220, 38, 38);
        pdf.setLineWidth(0.6);
        pdf.line(margin, y, margin + contentWidth, y);
        y += 7;
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        pdf.setTextColor(35, 35, 40);
        pdf.text(title, margin, y);
        y += 7;
      };

      const addField = (label: string, value: string) => {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.setTextColor(110, 110, 120);
        pdf.text(label.toUpperCase(), margin, y);
        y += 4;
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.setTextColor(35, 35, 40);
        const lines = pdf.splitTextToSize(value || "—", contentWidth);
        ensureSpace(lines.length * 5 + 3);
        pdf.text(lines, margin, y);
        y += lines.length * 5 + 3;
      };

      const addFareRow = (label: string, value: string) => {
        ensureSpace(8);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.setTextColor(70, 70, 80);
        pdf.text(label, margin, y);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(35, 35, 40);
        pdf.text(value, margin + contentWidth, y, { align: "right" });
        y += 7;
      };

      const formatPdfMoney = (amountPaise: number) => {
        const amount = amountPaise / 100;
        const paidAmount = receipt.payment.currency === "INR"
          ? amount
          : Number(receipt.payment.totalAmount) *
            (amount / (receipt.fareBreakdown.totalPaise / 100));
        return formatPdfAmount(paidAmount, receipt.payment.currency);
      };

      pdf.setFillColor(185, 28, 28);
      pdf.rect(0, 0, pageWidth, 9, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(19);
      pdf.setTextColor(25, 25, 30);
      pdf.text("RideX", margin, y);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(90, 90, 100);
      pdf.text("PAYMENT RECEIPT", pageWidth - margin, y, { align: "right" });
      y += 9;
      pdf.setFontSize(9);
      pdf.text(`Receipt: ${receipt.receiptNumber}`, margin, y);
      pdf.text(formatDateTime(receipt.date), pageWidth - margin, y, { align: "right" });
      y += 8;

      addSection("TRIP DETAILS");
      addField("Passenger", `${receipt.rider.name} · ${receipt.rider.email} · ${receipt.rider.phone}`);
      addField(
        "Driver & vehicle",
        `${receipt.driver.name} · ${receipt.driver.vehicle.vehicleType} ${receipt.driver.vehicle.vehicleModel} · ${receipt.driver.vehicle.vehicleNumber}`,
      );
      addField("Pickup", receipt.pickup.address);
      addField("Drop-off", receipt.drop.address);
      addField("Distance / duration", `${receipt.distanceKm.toFixed(1)} km · ${receipt.durationMin} minutes`);

      addSection("FARE BREAKDOWN");
      addFareRow("Base fare", formatPdfMoney(receipt.fareBreakdown.basePaise));
      addFareRow("Distance", formatPdfMoney(receipt.fareBreakdown.distancePaise));
      addFareRow("Time", formatPdfMoney(receipt.fareBreakdown.timePaise));
      if (receipt.fareBreakdown.adjustmentPaise !== 0) {
        addFareRow("Fare adjustment", formatPdfMoney(receipt.fareBreakdown.adjustmentPaise));
      }
      if (receipt.fareBreakdown.taxesPaise !== 0) {
        addFareRow("Taxes", formatPdfMoney(receipt.fareBreakdown.taxesPaise));
      }

      ensureSpace(25);
      y += 2;
      pdf.setFillColor(250, 242, 242);
      pdf.roundedRect(margin, y - 5, contentWidth, 19, 2, 2, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(70, 35, 35);
      pdf.text(`PAYMENT ${receipt.payment.status}`, margin + 4, y + 2);
      pdf.setFontSize(14);
      pdf.text(
        formatPdfAmount(Number(receipt.payment.totalAmount), receipt.payment.currency),
        margin + contentWidth - 4,
        y + 2,
        { align: "right" },
      );
      y += 24;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);
      pdf.setTextColor(120, 120, 130);
      pdf.text("Generated by RideX · For help, contact developersaurabh001@gmail.com.", margin, y);

      pdf.save(`${receipt.receiptNumber}.pdf`);
      toast.success("PDF receipt downloaded.");
    } catch (downloadError: unknown) {
      toast.error(
        downloadError instanceof Error
          ? `Could not create the PDF receipt: ${downloadError.message}`
          : "Could not create the PDF receipt. Please try again.",
      );
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    void loadReceipt();
  }, [loadReceipt]);

  return (
    <main className="receipt-page mx-auto min-h-[65vh] max-w-4xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <div className="mb-5 flex items-center justify-between gap-3 print:hidden">
        <Button asChild variant="ghost" className="text-zinc-400 hover:text-white">
          <Link href={`/history/${encodeURIComponent(rideId)}`}><ArrowLeft aria-hidden="true" className="h-4 w-4" />Back to trip</Link>
        </Button>
        <Button onClick={() => void downloadReceipt()} disabled={!receipt || downloading} className="gradient-red text-white">
          {downloading
            ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
            : <ArrowDownToLine aria-hidden="true" className="h-4 w-4" />}
          {downloading ? "Creating PDF…" : "Download PDF receipt"}
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

function formatPdfAmount(amount: number, currency: CurrencyCode): string {
  const locale = currency === "INR" ? "en-IN" : "en-US";
  return `${currency} ${new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
}

export function ReceiptPage({ rideId }: { rideId: string }) {
  return (
    <ProtectedRoute>
      <ReceiptContent rideId={rideId} />
    </ProtectedRoute>
  );
}
