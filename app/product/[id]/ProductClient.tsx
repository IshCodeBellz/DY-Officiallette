"use client";
import { useEffect, useState } from "react";
import { useCart, useWishlist } from "@/components/providers/CartProvider";
import { lineIdFor } from "@/lib/types";
import { pushRecentlyViewed } from "@/components/home/RecentlyViewed";
import { useToast } from "@/components/providers/ToastProvider";

interface ProductClientProps {
  product: {
    id: string;
    name: string;
    priceCents: number;
    image: string;
    description: string;
    sizes: string[];
    images: string[];
  };
}

export default function ProductClient({ product }: ProductClientProps) {
  const [size, setSize] = useState<string>("");
  const { addItem } = useCart();
  const { toggle, has } = useWishlist();
  const wishId = lineIdFor(product.id, size || undefined);
  const { push } = useToast();

  // Track recently viewed (client only, once on mount / product change)
  useEffect(() => {
    pushRecentlyViewed(product.id);
    // Fire a DETAIL_VIEW engagement event
    try {
      navigator.sendBeacon?.(
        "/api/events",
        new Blob([JSON.stringify([{ productId: product.id, type: "DETAIL_VIEW" }])], { type: "application/json" })
      );
    } catch {}
  }, [product.id]);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (product.sizes.length && !size) {
      alert("Please select a size");
      return;
    }
    addItem(
      {
        productId: product.id,
        name: product.name,
        priceCents: product.priceCents,
        image: product.image,
        size: size || undefined,
      },
      1
    );
    // Fire-and-forget engagement event (add to cart)
    try {
      navigator.sendBeacon?.(
        "/api/events",
        new Blob(
          [JSON.stringify([{ productId: product.id, type: "ADD_TO_CART" }])],
          { type: "application/json" }
        )
      );
    } catch {}
    push({ type: "success", message: "Added to bag" });
  }

  function handleWishlist() {
    toggle({
      productId: product.id,
      name: product.name,
      priceCents: product.priceCents,
      image: product.image,
      size: size || undefined,
    });
    try {
      navigator.sendBeacon?.(
        "/api/events",
        new Blob(
          [
            JSON.stringify([
              {
                productId: product.id,
                type: has(wishId) ? "UNWISHLIST" : "WISHLIST",
              },
            ]),
          ],
          { type: "application/json" }
        )
      );
    } catch {}
    push({
      type: has(wishId) ? "info" : "success",
      message: has(wishId) ? "Removed from saved" : "Saved",
    });
  }

  return (
    <form className="space-y-4" onSubmit={handleAdd}>
      {product.sizes.length > 0 && (
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide mb-1">
            Size
          </label>
          <select
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
          >
            <option value="">Select size</option>
            {product.sizes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      )}
      <button type="submit" className="btn-primary w-full">
        Add to bag
      </button>
      <button
        type="button"
        onClick={handleWishlist}
        className={`btn-outline w-full ${
          has(wishId) ? "border-neutral-900" : ""
        }`}
      >
        {has(wishId) ? "Remove from saved" : "Save for later"}
      </button>
    </form>
  );
}
