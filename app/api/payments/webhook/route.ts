import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { withRequest } from "@/lib/server/logger";
import { sendPaymentReceipt } from "@/lib/server/mailer";
import { OrderStatus, PaymentStatus, OrderEventKind } from "@/lib/status";
import { getStripe } from "@/lib/server/stripe";
import Stripe from "stripe";

// Handles both simulated (no Stripe key) and real Stripe webhook events.
export async function POST(req: NextRequest) {
  const forceSim =
    process.env.NODE_ENV === "test" &&
    req.headers.get("x-test-simulate-webhook") === "1";
  const stripe = forceSim ? null : getStripe();
  let paymentIntentId: string | undefined;
  let status: string | undefined;

  if (stripe) {
    const sig = req.headers.get("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!sig || !webhookSecret) {
      return NextResponse.json({ error: "missing_signature" }, { status: 400 });
    }
    const rawBody = await req.text();
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err: any) {
      return NextResponse.json(
        { error: "invalid_signature", message: err.message },
        { status: 400 }
      );
    }
    if (
      event.type === "payment_intent.succeeded" ||
      event.type === "payment_intent.payment_failed"
    ) {
      const pi = event.data.object as Stripe.PaymentIntent;
      paymentIntentId = pi.id;
      status =
        event.type === "payment_intent.succeeded" ? "succeeded" : "failed";
    } else {
      return NextResponse.json({ received: true });
    }
  } else {
    // Fallback simulated mode - accept JSON only
    let body: any = null;
    try {
      body = await req.json();
    } catch {
      body = null;
    }
    if (!body)
      return NextResponse.json(
        { error: "invalid_payload", reason: "no_json" },
        { status: 400 }
      );
    // Accept a few alias keys to make tests / tooling flexible
    paymentIntentId = [
      body.paymentIntentId,
      body.payment_intent_id,
      body.id,
    ].find((v: any) => typeof v === "string");
    status =
      typeof body.status === "string"
        ? body.status
        : typeof body.state === "string"
        ? body.state
        : undefined;
    if (typeof status === "string") status = status.toLowerCase();
    // Normalise to canonical succeeded/failed strings
    if (status === "success") status = "succeeded";
    if (status === "fail") status = "failed";
  }
  if (!paymentIntentId || !status) {
    return NextResponse.json(
      { error: "missing_parameters", got: { paymentIntentId, status } },
      { status: 400 }
    );
  }
  if (status !== "succeeded" && status !== "failed") {
    return NextResponse.json(
      { error: "invalid_status", status },
      { status: 400 }
    );
  }

  const payment = await prisma.paymentRecord.findFirst({
    where: { provider: "STRIPE", providerRef: paymentIntentId },
  });
  if (!payment) {
    // Gracefully ack unknown payment intent to keep webhook idempotent (could log)
    return NextResponse.json({ ok: true, ignored: true });
  }

  const order = await prisma.order.findUnique({
    where: { id: payment.orderId },
  });
  if (!order)
    return NextResponse.json({ error: "order_not_found" }, { status: 404 });

  if (status === "succeeded") {
    // Skip if already captured / paid
    if (
      payment.status === PaymentStatus.CAPTURED ||
      order.status === OrderStatus.PAID
    ) {
      return NextResponse.json({ ok: true, idempotent: true });
    }
    await prisma.$transaction(async (tx) => {
      await tx.paymentRecord.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.CAPTURED },
      });
      await tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.PAID, paidAt: new Date() },
      });
      await (tx as any).orderEvent.create({
        data: {
          orderId: order.id,
          kind: OrderEventKind.PAYMENT_SUCCEEDED,
          message: "Payment captured",
          meta: JSON.stringify({
            paymentId: payment.id,
            providerRef: payment.providerRef,
          }),
        },
      });
      if (order.userId) {
        const cart = await tx.cart.findUnique({
          where: { userId: order.userId },
        });
        if (cart) await tx.cartLine.deleteMany({ where: { cartId: cart.id } });
      }
    });

    // Email user about payment capture
    try {
      if (order.userId) {
        const user = await prisma.user.findUnique({
          where: { id: order.userId },
        });
        if (user) await sendPaymentReceipt(user, order);
      }
    } catch (error) {
      console.error("Error:", error);
      console.error("Error:", error);
    }
  } else if (status === "failed") {
    if (payment.status !== PaymentStatus.FAILED) {
      await prisma.$transaction(async (tx) => {
        await tx.paymentRecord.update({
          where: { id: payment.id },
          data: { status: PaymentStatus.FAILED },
        });
        await (tx as any).orderEvent.create({
          data: {
            orderId: order.id,
            kind: OrderEventKind.PAYMENT_FAILED,
            message: "Payment failed",
            meta: JSON.stringify({
              paymentId: payment.id,
              providerRef: payment.providerRef,
            }),
          },
        });
      });
    }
  }

  return NextResponse.json({ ok: true });
}
