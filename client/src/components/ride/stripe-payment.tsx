"use client";

import { useState, type FormEvent } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { CreditCard, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { normalizeApiError } from "@/lib/api";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

type StripePaymentProps = {
  clientSecret: string;
  onPaid: (paymentIntentId: string) => Promise<void>;
};

export default function StripePayment({ clientSecret, onPaid }: StripePaymentProps) {
  if (!stripePromise) {
    return (
      <p className="rounded-lg border border-red-400/20 bg-red-400/[0.06] p-3 text-sm text-red-200">
        Card payments aren’t configured. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to enable checkout.
      </p>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "night",
          variables: {
            colorPrimary: "#ef4444",
            colorBackground: "#111114",
            colorText: "#fafafa",
            colorDanger: "#f87171",
          },
        },
      }}
    >
      <StripePaymentForm onPaid={onPaid} />
    </Elements>
  );
}

function StripePaymentForm({ onPaid }: Pick<StripePaymentProps, "onPaid">) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!stripe || !elements) {
      setError("Payment form is still loading. Please try again.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await stripe.confirmPayment({ elements, redirect: "if_required" });
      if (result.error) {
        setError(result.error.message ?? "The payment could not be completed.");
        return;
      }
      if (result.paymentIntent?.status !== "succeeded") {
        setError(`Payment is ${result.paymentIntent?.status ?? "not confirmed"}. Please try again.`);
        return;
      }
      await onPaid(result.paymentIntent.id);
    } catch (paymentError: unknown) {
      setError(normalizeApiError(paymentError).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={(event) => void submit(event)} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-xs text-red-300" role="alert">{error}</p>}
      <Button type="submit" className="gradient-red w-full text-white" disabled={!stripe || !elements || submitting}>
        {submitting ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <CreditCard aria-hidden="true" className="h-4 w-4" />}
        Pay securely
      </Button>
    </form>
  );
}
