"use client";
import { useState, useEffect, useRef } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { useCart } from "@/components/providers/CartProvider";
import { useSession } from "next-auth/react";
import { formatPriceCents } from "@/lib/money";

const stripePromise =
  typeof window !== "undefined" &&
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
    : null;

interface PrimedOrderData {
  orderId: string;
  clientSecret: string;
  paymentIntentId: string;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
}

export default function CheckoutClient() {
  const { items, subtotal, clear, hydrated } = useCart();
  const { status: authStatus } = useSession();
  const [step, setStep] = useState<"form" | "payment" | "success">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [primed, setPrimed] = useState<PrimedOrderData | null>(null);
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [discountInput, setDiscountInput] = useState("");
  const [discountStatus, setDiscountStatus] = useState<
    | { state: "idle" }
    | { state: "checking" }
    | { state: "invalid"; reason: string }
    | {
        state: "valid";
        kind: "FIXED" | "PERCENT";
        valueCents: number | null;
        percent: number | null;
        minSubtotalCents: number | null;
      }
  >({ state: "idle" });
  const lastValidated = useRef<string>("");

  // Debounced live validation of discount code
  useEffect(() => {
    const code = discountInput.trim();
    if (!code) {
      setDiscountStatus({ state: "idle" });
      return;
    }
    setDiscountStatus({ state: "checking" });
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/discount-codes/validate?code=${encodeURIComponent(code)}`
        );
        if (!res.ok) {
          setDiscountStatus({ state: "invalid", reason: "server" });
          return;
        }
        const data = await res.json();
        if (!data.valid) {
          setDiscountStatus({
            state: "invalid",
            reason: data.reason || "invalid",
          });
        } else {
          lastValidated.current = code.toUpperCase();
          setDiscountStatus({
            state: "valid",
            kind: data.kind,
            valueCents: data.valueCents,
            percent: data.percent,
            minSubtotalCents: data.minSubtotalCents,
          });
        }
      } catch {
        setDiscountStatus({ state: "invalid", reason: "network" });
      }
    }, 450);
    return () => clearTimeout(t);
  }, [discountInput]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (authStatus !== "authenticated")
        throw new Error("Please sign in first");
      if (!hydrated) throw new Error("Cart not ready yet");
      if (items.length === 0) throw new Error("Empty cart");
      // Persist cart to backend (replace existing)
      await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: items.map((i) => ({
            productId: i.productId,
            size: i.size,
            qty: i.qty,
          })),
        }),
      });
      const fd = new FormData(e.target as HTMLFormElement);
      const shipping = {
        fullName: fd.get("fullName") as string,
        line1: fd.get("line1") as string,
        line2: (fd.get("line2") as string) || undefined,
        city: fd.get("city") as string,
        region: (fd.get("region") as string) || undefined,
        postalCode: fd.get("postalCode") as string,
        country: fd.get("country") as string,
        phone: (fd.get("phone") as string) || undefined,
      };
      const discountCode =
        ((fd.get("discountCode") as string) || "").trim() || undefined;
      // Ensure we only send validated code (avoid typos mid-change)
      const codeToSend =
        discountCode && discountCode.toUpperCase() === lastValidated.current
          ? discountCode
          : undefined;
      const email = (fd.get("email") as string) || undefined;
      const checkoutRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingAddress: shipping,
          email,
          discountCode: codeToSend,
          idempotencyKey,
        }),
      });
      if (!checkoutRes.ok) {
        const text = await checkoutRes.text();
        let data: any = {};
        try {
          data = JSON.parse(text);
        } catch {}
        throw new Error(
          data.error
            ? `Checkout failed: ${data.error}`
            : `Checkout failed (${checkoutRes.status})`
        );
      }
      const checkoutData = await checkoutRes.json();
      // Create payment intent
      const piRes = await fetch("/api/payments/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: checkoutData.orderId }),
      });
      if (!piRes.ok) {
        const text = await piRes.text();
        let data: any = {};
        try {
          data = JSON.parse(text);
        } catch {}
        throw new Error(
          data.error
            ? `Payment intent failed: ${data.error}`
            : `Payment intent failed (${piRes.status})`
        );
      }
      const piData = await piRes.json();
      setPrimed({
        orderId: checkoutData.orderId,
        clientSecret: piData.clientSecret,
        paymentIntentId: piData.paymentIntentId,
        subtotalCents: checkoutData.subtotalCents,
        discountCents: checkoutData.discountCents,
        totalCents: checkoutData.totalCents,
      });
      setStep("payment");
    } catch (err: any) {
      setError(err.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  if (step === "success") {
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-2xl font-semibold mb-4">Thank you!</h1>
        <p className="text-sm text-neutral-600">Your payment was received.</p>
      </div>
    );
  }

  if (step === "payment" && primed && stripePromise) {
    return (
      <Elements
        options={{ clientSecret: primed.clientSecret }}
        stripe={stripePromise}
      >
        <PaymentStep
          primed={primed}
          onSuccess={() => {
            clear();
            setStep("success");
          }}
        />
      </Elements>
    );
  }

  if (authStatus === "loading" || !hydrated) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p className="text-sm text-neutral-600">Preparing checkout…</p>
      </div>
    );
  }
  if (authStatus !== "authenticated") {
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-2xl font-semibold mb-4">Checkout</h1>
        <p className="text-sm">Please sign in to continue.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-2xl font-semibold mb-6">Checkout</h1>
      {error && (
        <div className="bg-red-100 text-red-700 p-2 rounded text-sm mb-4">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2 font-medium text-neutral-700">
          Shipping
        </div>
        <input
          name="fullName"
          required
          placeholder="Full name"
          className="input"
        />
        <input
          name="email"
          type="email"
          placeholder="Email (optional)"
          className="input"
        />
        <input
          name="line1"
          required
          placeholder="Address line 1"
          className="input"
        />
        <input name="line2" placeholder="Address line 2" className="input" />
        <input name="city" required placeholder="City" className="input" />
        <input name="region" placeholder="Region / State" className="input" />
        <input
          name="postalCode"
          required
          placeholder="Postal code"
          className="input"
        />
        <input
          name="country"
          required
          placeholder="Country"
          className="input"
          defaultValue="US"
        />
        <input name="phone" placeholder="Phone" className="input" />
        <div className="md:col-span-2 mt-4 font-medium text-neutral-700 flex items-center gap-2">
          <span>Discount code</span>
        </div>
        <div className="space-y-1 md:col-span-2">
          <input
            name="discountCode"
            placeholder="CODE"
            className="input"
            value={discountInput}
            onChange={(e) => setDiscountInput(e.target.value.toUpperCase())}
          />
          {discountStatus.state === "checking" && (
            <p className="text-xs text-neutral-500">Checking…</p>
          )}
          {discountStatus.state === "invalid" && (
            <p className="text-xs text-red-600">
              {discountStatus.reason === "not_found" && "Code not found"}
              {discountStatus.reason === "missing_code" && "Enter a code"}
              {discountStatus.reason === "network" && "Network error"}
              {!["not_found", "missing_code", "network"].includes(
                discountStatus.reason
              ) && "Not valid"}
            </p>
          )}
          {discountStatus.state === "valid" && (
            <p className="text-xs text-green-600">
              {discountStatus.kind === "FIXED"
                ? `Valid: saves $${(
                    (discountStatus.valueCents || 0) / 100
                  ).toFixed(2)}`
                : `Valid: ${discountStatus.percent}% off`}
              {discountStatus.minSubtotalCents
                ? ` (min ${formatPriceCents(discountStatus.minSubtotalCents)})`
                : ""}
            </p>
          )}
        </div>
        <div className="md:col-span-2 border-t pt-4 mt-2 space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatPriceCents(Math.round(subtotal * 100))}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>$0.00</span>
          </div>
          {discountStatus.state === "valid" && (
            <div className="flex justify-between text-green-700">
              <span>Discount</span>
              <span>
                {discountStatus.kind === "FIXED"
                  ? "-" + formatPriceCents(discountStatus.valueCents || 0)
                  : `-${discountStatus.percent}%`}
              </span>
            </div>
          )}
          <div className="flex justify-between font-semibold border-t pt-2">
            <span>Total</span>
            <span>
              {(() => {
                const base = Math.round(subtotal * 100);
                if (discountStatus.state !== "valid")
                  return formatPriceCents(base);
                if (discountStatus.kind === "FIXED") {
                  const v = Math.min(base, discountStatus.valueCents || 0);
                  return formatPriceCents(base - v);
                }
                const pct = discountStatus.percent || 0;
                const off = Math.floor((base * pct) / 100);
                return formatPriceCents(base - off);
              })()}
            </span>
          </div>
        </div>
        <div className="md:col-span-2">
          <button
            disabled={loading || items.length === 0}
            className="btn-primary w-full"
          >
            {loading ? "Processing..." : "Continue to payment"}
          </button>
        </div>
      </form>
      {!stripePromise && (
        <p className="text-xs text-neutral-500 mt-4">
          Stripe publishable key not configured — payment step simulated only.
        </p>
      )}
    </div>
  );
}

function PaymentStep({
  primed,
  onSuccess,
}: {
  primed: PrimedOrderData;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setErr(null);
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url:
          window.location.origin + "/account/orders/" + primed.orderId,
      },
      redirect: "if_required",
    });
    if (error) {
      setErr(error.message || "Payment error");
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      onSuccess();
    } else {
      // rely on webhook + redirect
      onSuccess();
    }
    setSubmitting(false);
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-lg">
      <h1 className="text-2xl font-semibold mb-6">Payment</h1>
      <form onSubmit={handlePay} className="space-y-4">
        <PaymentElement />
        {err && (
          <div className="bg-red-100 text-red-600 p-2 rounded text-sm">
            {err}
          </div>
        )}
        <button disabled={!stripe || submitting} className="btn-primary w-full">
          {submitting ? "Paying..." : "Pay now"}
        </button>
      </form>
    </div>
  );
}
