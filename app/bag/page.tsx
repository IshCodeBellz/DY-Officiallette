"use client";
import { useCart } from "@/components/providers/CartProvider";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";

export default function BagPage() {
  const { items, subtotal, updateQty, removeItem, clear } = useCart();
  const { formatPrice, convertPrice } = useCurrency();
  const { status: authStatus } = useSession();
  const router = useRouter();
  const [checkingOut, setCheckingOut] = useState(false);

  async function handleCheckout() {
    if (items.length === 0 || checkingOut) return;
    setCheckingOut(true);
    try {
      if (authStatus !== "authenticated") {
        // Send user to login, then back to checkout; fallback to /login if callback unsupported.
        router.push(`/login?callbackUrl=${encodeURIComponent("/checkout")}`);
        return;
      }
      // Persist latest cart snapshot to server before navigating so checkout API sees lines.
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
      }).catch(() => {});
      router.push("/checkout");
    } finally {
      // Do not reset immediately to avoid double-click during navigation
      setTimeout(() => setCheckingOut(false), 800);
    }
  }
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Your bag</h1>
      {items.length === 0 && (
        <p className="text-sm text-neutral-600">Your bag is empty.</p>
      )}
      <div className="grid gap-10 md:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          {items.map((line) => (
            <div key={line.id} className="flex gap-4 border-b pb-4">
              <div className="relative w-28 h-36 bg-neutral-100 rounded overflow-hidden">
                <Image
                  src={line.image}
                  alt={line.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="font-medium truncate">{line.name}</div>
                <div className="text-xs text-neutral-600">
                  Size: {line.size ? line.size : "One size"}
                </div>
                <div className="text-sm font-semibold">
                  {formatPrice(convertPrice(line.priceCents))}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <label className="text-xs uppercase tracking-wide">Qty</label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={line.qty}
                    onChange={(e) =>
                      updateQty(line.id, parseInt(e.target.value || "1", 10))
                    }
                    className="w-16 border border-neutral-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(line.id)}
                    className="text-xs text-neutral-500 hover:text-neutral-900"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
          {items.length > 0 && (
            <button onClick={clear} className="btn-outline text-xs">
              Clear bag
            </button>
          )}
        </div>
        <aside className="space-y-4 border rounded p-6 h-fit bg-neutral-50">
          <h2 className="font-semibold">Summary</h2>
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatPrice(convertPrice(Math.round(subtotal * 100)))}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Delivery</span>
            <span>Calculated at checkout</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-semibold">
            <span>Total</span>
            <span>{formatPrice(convertPrice(Math.round(subtotal * 100)))}</span>
          </div>
          <button
            disabled={items.length === 0 || checkingOut}
            onClick={handleCheckout}
            className="btn-primary w-full mt-4 disabled:opacity-50"
          >
            {checkingOut
              ? authStatus === "authenticated"
                ? "Loading checkout..."
                : "Redirecting to sign in..."
              : "Checkout"}
          </button>
        </aside>
      </div>
    </div>
  );
}
