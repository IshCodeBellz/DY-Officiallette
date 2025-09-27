"use client";
import { useWishlist, useCart } from "@/components/providers/CartProvider";
import { formatPriceCents } from "@/lib/money";
import Image from "next/image";

export default function SavedPage() {
  const { items, remove, moveToCart } = useWishlist();
  const { addItem } = useCart();
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Saved items</h1>
      {items.length === 0 && (
        <p className="text-sm text-neutral-600">You have no saved items.</p>
      )}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {items.map((w) => (
          <div
            key={w.id}
            className="group relative bg-neutral-100 rounded overflow-hidden flex flex-col"
          >
            <div className="relative aspect-[3/4]">
              <Image src={w.image} alt={w.name} fill className="object-cover" />
            </div>
            <div className="p-3 space-y-1 text-sm">
              <div className="font-medium line-clamp-2 leading-tight">
                {w.name}
              </div>
              {w.size && (
                <div className="text-xs text-neutral-500">Size: {w.size}</div>
              )}
              <div className="font-semibold">
                {formatPriceCents(w.priceCents)}
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => moveToCart(w.id, addItem)}
                  className="btn-primary flex-1 text-xs py-1"
                >
                  Add to bag
                </button>
                <button
                  onClick={() => remove(w.id)}
                  className="btn-outline flex-1 text-xs py-1"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
