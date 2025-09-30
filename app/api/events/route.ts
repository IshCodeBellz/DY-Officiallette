import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { withRequest } from "@/lib/server/logger";

// Local metric field union (mirrors ProductMetrics model fields except id/meta)
type MetricField =
  | "views"
  | "detailViews"
  | "wishlists"
  | "addToCart"
  | "purchases";

// Accepted event types and which counter they increment
const MAP: Record<string, MetricField | null> = {
  VIEW: "views",
  DETAIL_VIEW: "detailViews",
  WISHLIST: "wishlists",
  UNWISHLIST: null, // no decrement to keep API idempotent-lite
  ADD_TO_CART: "addToCart",
  PURCHASE: "purchases",
};

export const POST = withRequest(async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 }
    );
  }
  if (!Array.isArray(body)) {
    return NextResponse.json(
      { ok: false, error: "Expected array" },
      { status: 400 }
    );
  }

  // Aggregate increments per product
  const agg: Record<string, Partial<Record<MetricField, number>>> = {};
  for (const evt of body) {
    if (!evt || typeof evt !== "object") continue;
    const { productId, type } = evt;
    if (typeof productId !== "string" || productId.length < 5) continue;
    const key = MAP[type];
    if (!key) continue;
    agg[productId] ||= {};
    agg[productId][key] = (agg[productId][key] || 0) + 1;
  }

  const entries = Object.entries(agg);
  if (entries.length) {
    // Use raw upsert (SQLite) to avoid needing the typed delegate (works even if generation lagged)
    // ON CONFLICT(productId) increments existing counters.
    await prisma.$transaction(
      entries.map(([productId, inc]) =>
        prisma.$executeRawUnsafe(
          `INSERT INTO ProductMetrics (productId, views, detailViews, wishlists, addToCart, purchases, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
           ON CONFLICT(productId) DO UPDATE SET
             views = views + excluded.views,
             detailViews = detailViews + excluded.detailViews,
             wishlists = wishlists + excluded.wishlists,
             addToCart = addToCart + excluded.addToCart,
             purchases = purchases + excluded.purchases,
             updatedAt = CURRENT_TIMESTAMP;`,
          productId,
          inc.views || 0,
          inc.detailViews || 0,
          inc.wishlists || 0,
          inc.addToCart || 0,
          inc.purchases || 0
        )
      )
    );
  }

  return NextResponse.json({ ok: true, updated: entries.length });
});

export const runtime = "nodejs";
