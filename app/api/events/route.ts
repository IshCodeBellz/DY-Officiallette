import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

// Local metric field union (mirrors ProductMetrics model fields except id/meta)
type MetricField = "views" | "detailViews" | "wishlists" | "addToCart" | "purchases";

// Accepted event types and which counter they increment
const MAP: Record<string, MetricField | null> = {
  VIEW: "views",
  DETAIL_VIEW: "detailViews",
  WISHLIST: "wishlists",
  UNWISHLIST: null, // no decrement to keep API idempotent-lite
  ADD_TO_CART: "addToCart",
  PURCHASE: "purchases",
};

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  if (!Array.isArray(body)) {
    return NextResponse.json({ ok: false, error: "Expected array" }, { status: 400 });
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

  const ops = Object.entries(agg).map(([productId, inc]) =>
    (prisma as any).productMetrics.upsert({
      where: { productId },
      create: {
        productId,
        views: inc.views || 0,
        detailViews: inc.detailViews || 0,
        wishlists: inc.wishlists || 0,
        addToCart: inc.addToCart || 0,
        purchases: inc.purchases || 0,
      },
      update: {
        views: { increment: inc.views || 0 },
        detailViews: { increment: inc.detailViews || 0 },
        wishlists: { increment: inc.wishlists || 0 },
        addToCart: { increment: inc.addToCart || 0 },
        purchases: { increment: inc.purchases || 0 },
      },
    })
  );

  if (ops.length) await prisma.$transaction(ops);
  return NextResponse.json({ ok: true, updated: ops.length });
}

export const runtime = 'nodejs';