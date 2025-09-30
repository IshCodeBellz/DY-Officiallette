"use client";
import { notFound } from "next/navigation";
import Link from "next/link";
import { useWishlist, useCart } from "@/components/providers/CartProvider";
import { useState, useEffect, useRef } from "react";
import { lineIdFor } from "@/lib/types";
import { formatPriceCents } from "@/lib/money";
import { useToast } from "@/components/providers/ToastProvider";

const validCategories = [
  "women",
  "men",
  "clothing",
  "shoes",
  "accessories",
  "sportswear",
  "face-body",
  "brands",
];

export default function CategoryPage({
  params,
}: {
  params: { category: string };
}) {
  const { toggle, has } = useWishlist();
  const { addItem } = useCart();
  const { push } = useToast();
  const category = params.category.toLowerCase();
  if (!validCategories.includes(category)) return notFound();

  const [size, setSize] = useState<string>("");
  const [price, setPrice] = useState<[number, number]>([0, 200]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const viewedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // If navigating to face-body, ensure any previously selected apparel size is cleared
    if (category === "face-body" && size) {
      setSize("");
    }
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("category", category);
      if (query) params.set("q", query);
      // Only include size filter for non face-body categories (apparel sizing)
      if (size && category !== "face-body") params.set("size", size);
      if (price[0] !== 0) params.set("min", String(price[0]));
      if (price[1] !== 200) params.set("max", String(price[1]));
      try {
        const res = await fetch(`/api/products?${params.toString()}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          // normalize to ensure priceCents present (API already provides priceCents + legacy price)
          setItems(
            (data.items || []).map((p: any) => ({
              ...p,
              priceCents: p.priceCents ?? Math.round((p.price || 0) * 100),
            }))
          );
        }
      } catch (e) {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [category, query, size, price]);

  const isFaceBody = category === "face-body";
  return (
    <div className="container mx-auto px-4 py-10 space-y-10">
      {isFaceBody && (
        <section className="relative h-64 md:h-80 w-full overflow-hidden rounded-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://picsum.photos/seed/facebody-hero/1600/900"
            alt="Face and body care assortment"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="relative z-10 h-full flex flex-col justify-end p-6 md:p-10 text-white">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Face + Body
            </h1>
            <p className="mt-2 max-w-xl text-sm md:text-base text-neutral-100">
              Skincare, grooming & body care essentials — hydrate, protect and
              glow.
            </p>
          </div>
        </section>
      )}
      <header className="flex flex-col md:flex-row md:items-end gap-4">
        <h1
          className={`text-3xl font-bold capitalize ${
            isFaceBody ? "sr-only" : ""
          }`}
        >
          {category}
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Showing {items.length} items {loading && <span>(loading...)</span>}
        </p>
      </header>
      <div className="flex flex-wrap gap-4 items-end text-sm">
        <div className="flex flex-col gap-1">
          <label className="text-xs uppercase tracking-wide font-semibold">
            Search
          </label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter in page"
            className="border border-neutral-300 dark:border-neutral-600 rounded px-2 py-1 bg-white dark:bg-neutral-800"
          />
        </div>
        {!isFaceBody && (
          <div className="flex flex-col gap-1">
            <label className="text-xs uppercase tracking-wide font-semibold">
              Size
            </label>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="border border-neutral-300 dark:border-neutral-600 rounded px-2 py-1 bg-white dark:bg-neutral-800"
            >
              <option value="">All</option>
              {["XS", "S", "M", "L", "XL"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="flex flex-col gap-1">
          <label className="text-xs uppercase tracking-wide font-semibold">
            Price ${price[0]} - ${price[1]}
          </label>
          <div className="flex items-center gap-2 w-56">
            <input
              type="range"
              min={0}
              max={200}
              value={price[0]}
              onChange={(e) => setPrice([Number(e.target.value), price[1]])}
              className="w-full"
            />
            <input
              type="range"
              min={0}
              max={200}
              value={price[1]}
              onChange={(e) => setPrice([price[0], Number(e.target.value)])}
              className="w-full"
            />
          </div>
        </div>
        {(size || query || price[0] !== 0 || price[1] !== 200) && (
          <button
            onClick={() => {
              setSize("");
              setQuery("");
              setPrice([0, 200]);
            }}
            className="btn-outline text-xs"
          >
            Reset
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {items.map((p) => {
          const id = lineIdFor(p.id);
          const inWish = has(id);
          const hasSizes = Array.isArray(p.sizes) && p.sizes.length > 0;
          // Local ephemeral chosen size per product (keyed by id) – simple ref via data attribute
          return (
            <div
              key={p.id}
              className="group relative bg-neutral-100 aspect-[3/4] overflow-hidden rounded flex flex-col"
              ref={(el) => {
                if (!el) return;
                if (viewedRef.current.has(p.id)) return;
                const io = new IntersectionObserver(
                  (entries) => {
                    entries.forEach((e) => {
                      if (e.isIntersecting) {
                        viewedRef.current.add(p.id);
                        try {
                          navigator.sendBeacon?.(
                            "/api/events",
                            new Blob(
                              [
                                JSON.stringify([
                                  { productId: p.id, type: "VIEW" },
                                ]),
                              ],
                              { type: "application/json" }
                            )
                          );
                        } catch {}
                        io.disconnect();
                      }
                    });
                  },
                  { threshold: 0.4 }
                );
                io.observe(el);
              }}
            >
              <Link href={`/product/${p.id}`} className="absolute inset-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.image}
                  alt={p.name}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                />
              </Link>
              <div className="absolute top-2 right-2 flex flex-col gap-2">
                <button
                  onClick={() => {
                    const already = inWish;
                    toggle({
                      productId: p.id,
                      name: p.name,
                      priceCents: p.priceCents,
                      image: p.image,
                    });
                    try {
                      navigator.sendBeacon?.(
                        "/api/events",
                        new Blob(
                          [
                            JSON.stringify([
                              {
                                productId: p.id,
                                type: already ? "UNWISHLIST" : "WISHLIST",
                              },
                            ]),
                          ],
                          { type: "application/json" }
                        )
                      );
                    } catch {}
                    push({
                      type: already ? "info" : "success",
                      message: already ? "Removed from saved" : "Saved",
                    });
                  }}
                  className={`rounded-full h-8 w-8 text-[11px] font-semibold flex items-center justify-center backdrop-blur bg-white/80 border ${
                    inWish ? "border-neutral-900" : "border-transparent"
                  }`}
                >
                  {inWish ? "♥" : "♡"}
                </button>
                <div className="relative">
                  <button
                    onClick={(e) => {
                      if (hasSizes) {
                        // Open size chooser popover (toggle) instead of immediate add
                        const host = (e.currentTarget
                          .parentElement as HTMLElement)!.querySelector<HTMLElement>(
                          "[data-size-popover]"
                        );
                        if (host) host.toggleAttribute("data-open");
                        return;
                      }
                      addItem(
                        {
                          productId: p.id,
                          name: p.name,
                          priceCents: p.priceCents,
                          image: p.image,
                        },
                        1
                      );
                      try {
                        navigator.sendBeacon?.(
                          "/api/events",
                          new Blob(
                            [
                              JSON.stringify([
                                { productId: p.id, type: "ADD_TO_CART" },
                              ]),
                            ],
                            { type: "application/json" }
                          )
                        );
                      } catch {}
                      push({ type: "success", message: "Added to bag" });
                    }}
                    className="rounded-full h-8 w-8 text-[15px] leading-none font-semibold flex items-center justify-center backdrop-blur bg-white/80 border border-transparent"
                    aria-label={hasSizes ? "Choose size" : "Add to bag"}
                  >
                    +
                  </button>
                  {hasSizes && (
                    <div
                      data-size-popover
                      className="absolute top-9 right-0 z-20 hidden data-[open]:flex flex-col gap-1 bg-white shadow-lg border border-neutral-200 rounded p-2 min-w-[120px]"
                    >
                      <div className="text-[10px] uppercase tracking-wide font-semibold text-neutral-500 pb-1 border-b mb-1">
                        Select size
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {p.sizes.map((s: string) => (
                          <button
                            key={s}
                            onClick={() => {
                              addItem(
                                {
                                  productId: p.id,
                                  name: p.name,
                                  priceCents: p.priceCents,
                                  image: p.image,
                                  size: s,
                                },
                                1
                              );
                              try {
                                navigator.sendBeacon?.(
                                  "/api/events",
                                  new Blob(
                                    [
                                      JSON.stringify([
                                        {
                                          productId: p.id,
                                          type: "ADD_TO_CART",
                                        },
                                      ]),
                                    ],
                                    { type: "application/json" }
                                  )
                                );
                              } catch {}
                              push({
                                type: "success",
                                message: `Added ${s}`,
                              });
                              const host =
                                (document.querySelector(
                                  `[data-size-popover][data-open]`
                                ) as HTMLElement) || null;
                              host?.removeAttribute("data-open");
                            }}
                            className="px-2 py-1 text-[11px] rounded border border-neutral-300 hover:bg-neutral-100 active:bg-neutral-200"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => {
                          const host =
                            (document.querySelector(
                              `[data-size-popover][data-open]`
                            ) as HTMLElement) || null;
                          host?.removeAttribute("data-open");
                        }}
                        className="mt-2 text-[10px] text-neutral-500 hover:text-neutral-700"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 to-transparent text-white text-xs">
                <div className="font-semibold truncate">{p.name}</div>
                <div>{formatPriceCents(p.priceCents)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
