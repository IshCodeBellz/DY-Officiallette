import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/server/stripe";
import { prisma } from "@/lib/server/prisma";
import { validateEnv } from "@/lib/server/env";

// Stripe webhook handler: listens for payment_intent.succeeded and updates order & metrics.
// Expects STRIPE_WEBHOOK_SECRET if real Stripe is used; if absent, treats body as JSON (simulated mode).

export async function POST(req: NextRequest) {
  // Ensure env validation runs (idempotent) for early visibility in logs.
  validateEnv();
  const stripe = getStripe();
  let event: any;
  const sig = req.headers.get("stripe-signature");
  const rawBody = await req.text();
  if (stripe && process.env.STRIPE_WEBHOOK_SECRET) {
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        sig as string,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (e: any) {
      return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
    }
  } else {
    // Simulated mode: parse JSON directly
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "invalid_json" }, { status: 400 });
    }
  }

  if (event.type !== "payment_intent.succeeded") {
    return NextResponse.json({ received: true });
  }

  const pi = event.data?.object || event; // robust fallback in simulated mode
  const orderId = pi.metadata?.orderId;
  if (!orderId) return NextResponse.json({ error: "no_order" }, { status: 400 });

  // Idempotent: only move PENDING / AWAITING_PAYMENT -> PAID
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (order.status === "PAID") return NextResponse.json({ ok: true, idempotent: true });
  if (order.status !== "PENDING" && order.status !== "AWAITING_PAYMENT") {
    return NextResponse.json({ error: "invalid_status", status: order.status }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: { status: "PAID", paidAt: new Date() },
    });
    const productIds = Array.from(new Set(order.items.map((i) => i.productId)));
    for (const pid of productIds) {
      await tx.$executeRawUnsafe(
        `INSERT INTO ProductMetrics (productId, views, detailViews, wishlists, addToCart, purchases, updatedAt)
         VALUES (?, 0, 0, 0, 0, 1, CURRENT_TIMESTAMP)
         ON CONFLICT(productId) DO UPDATE SET
           purchases = purchases + 1,
           updatedAt = CURRENT_TIMESTAMP;`,
        pid
      );
    }
  });

  // Fire-and-forget purchase events ingestion (non-blocking). We don't await to keep webhook fast.
  try {
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order.items.map(i => ({ type: 'PURCHASE', productId: i.productId })))
    }).catch(() => {});
  } catch (_) {
    // ignore network errors in serverless env
  }

  return NextResponse.json({ ok: true });
}