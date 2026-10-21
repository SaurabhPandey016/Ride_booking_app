"use client";

import { useState, type FormEvent } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { AlertCircle, CreditCard, LoaderCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { normalizeApiError } from "@/lib/api";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
const validPublishableKey = publishableKey?.startsWith("pk_test_") ? publishableKey : null;
const stripePromise = validPublishableKey ? loadStripe(validPublishableKey) : null;

type StripePaymentProps = {
  clientSecret: string;
  onPaid: (paymentIntentId: string) => Promise<void>;
};

export default function StripePayment({ clientSecret, onPaid }: StripePaymentProps) {
  if (!stripePromise) {
    return (
      <p className="rounded-lg border border-red-400/20 bg-red-400/[0.06] p-3 text-sm text-red-200">
        Card checkout needs a Stripe test publishable key. In Stripe Dashboard, copy the test-mode key
        beginning with <code>pk_test_</code> into <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>.
        For local development, add it to <code>client/.env.local</code> and restart Next.js. On Vercel,
        add it to the project’s Production environment variables and redeploy. It must match the
        server’s Stripe test mode.
      </p>
    );
  }

  return (
    <Elements
      key={clientSecret}
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
  const [elementReady, setElementReady] = useState(false);
  const [elementError, setElementError] = useState<string | null>(null);
  const [elementAttempt, setElementAttempt] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!stripe || !elements || !elementReady || !elements.getElement(PaymentElement)) {
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
      {elementError ? (
        <div className="rounded-lg border border-red-400/20 bg-red-400/[0.06] p-3 text-sm text-red-100" role="alert">
          <p className="flex items-start gap-2">
            <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
            <span>
              Stripe couldn’t load this payment form. Confirm the client <code>pk_test_</code> and
              server <code>sk_test_</code> keys belong to the same Stripe account and are both in
              test mode. If you changed a key, restart the local app or redeploy it, then retry.
              {elementError && <span className="mt-2 block text-xs text-red-200/70">{elementError}</span>}
            </span>
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-3 min-h-11 border-red-300/20 text-red-100 hover:bg-red-300/10"
            onClick={() => {
              setElementReady(false);
              setElementError(null);
              setError(null);
              setElementAttempt((attempt) => attempt + 1);
            }}
          >
            <RefreshCw aria-hidden="true" className="h-4 w-4" />
            Retry payment form
          </Button>
        </div>
      ) : (
        <PaymentElement
          key={elementAttempt}
          onReady={() => {
            setElementReady(true);
            setElementError(null);
          }}
          onLoadError={({ error: loadError }) => {
            setElementReady(false);
            setElementError(loadError.message ?? "Stripe returned an unknown Payment Element error.");
          }}
        />
      )}
      {error && <p className="text-xs text-red-300" role="alert">{error}</p>}
      <Button
        type="submit"
        className="gradient-red w-full text-white"
        disabled={!stripe || !elements || !elementReady || Boolean(elementError) || submitting}
      >
        {submitting ? <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" /> : <CreditCard aria-hidden="true" className="h-4 w-4" />}
        {elementReady ? "Pay securely" : "Loading secure form…"}
      </Button>
    </form>
  );
}
