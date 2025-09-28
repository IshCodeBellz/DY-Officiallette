import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/server/authOptions";
import { prisma } from "@/lib/server/prisma";
import { z } from "zod";
import { getStripe } from "@/lib/server/stripe";

// Stub: would call Stripe to create a PaymentIntent. For now, we simulate one.
// Later replace with: const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });

const schema = z.object({ orderId: z.string() });

export async function POST(req: NextRequest) {
  let uid: string | undefined;
  const testUser =
    process.env.NODE_ENV === "test" ? req.headers.get("x-test-user") : null;
  if (testUser) {
    uid = testUser;
  } else {
    const session = await getServerSession(authOptions);
    uid = (session?.user as any)?.id as string | undefined;
  }
  if (!uid) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  const order = await prisma.order.findFirst({
    where: { id: parsed.data.orderId, userId: uid },
  });
  if (!order) return NextResponse.json({ error: "not_found" }, { status: 404 });
  // Allow requesting intent when order is still PENDING or already moved to AWAITING_PAYMENT (idempotent retrieval)
  if (order.status !== "PENDING" && order.status !== "AWAITING_PAYMENT") {
    return NextResponse.json(
      { error: "invalid_status", status: order.status },
      { status: 400 }
    );
  }

  const stripe = getStripe();
  if (!stripe) {
    // Simulated mode – reuse existing record if present for idempotency
    let existing = await prisma.paymentRecord.findFirst({
      where: { orderId: order.id, provider: "STRIPE" },
    });
    if (existing) {
      return NextResponse.json({
        orderId: order.id,
        clientSecret: `${existing.providerRef}_secret`,
        paymentIntentId: existing.providerRef,
        simulated: true,
        reused: true,
      });
    }
    // Deterministic simulated intent id derived from full order id hash fragment for stable reuse
    const fakePaymentIntentId = `pi_${order.id
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 10)}`;
    existing = await prisma.paymentRecord.create({
      data: {
        orderId: order.id,
        provider: "STRIPE",
        providerRef: fakePaymentIntentId,
        amountCents: order.totalCents,
        currency: order.currency,
        status: "PAYMENT_PENDING",
        rawPayload: JSON.stringify({ simulated: true }),
      },
    });
    if (order.status === "PENDING") {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "AWAITING_PAYMENT" },
      });
    }
    return NextResponse.json({
      orderId: order.id,
      clientSecret: `${existing.providerRef}_secret`,
      paymentIntentId: existing.providerRef,
      simulated: true,
    });
  }

  // Check if existing payment record for order to ensure idempotency for this endpoint
  const existingPayment = await prisma.paymentRecord.findFirst({
    where: { orderId: order.id, provider: "STRIPE" },
  });
  if (existingPayment) {
    try {
      const pi = await stripe.paymentIntents.retrieve(
        existingPayment.providerRef
      );
      return NextResponse.json({
        orderId: order.id,
        clientSecret: pi.client_secret,
        paymentIntentId: pi.id,
        reused: true,
      });
    } catch (_) {
      // if retrieval fails, fall through and create new
    }
  }

  const intent = await stripe.paymentIntents.create({
    amount: order.totalCents,
    currency: order.currency.toLowerCase(),
    metadata: { orderId: order.id },
    automatic_payment_methods: { enabled: true },
  });

  await prisma.paymentRecord.create({
    data: {
      orderId: order.id,
      provider: "STRIPE",
      providerRef: intent.id,
      amountCents: order.totalCents,
      currency: order.currency,
      status: "PAYMENT_PENDING",
      rawPayload: JSON.stringify({}),
    },
  });
  await prisma.order.update({
    where: { id: order.id },
    data: { status: "AWAITING_PAYMENT" },
  });
  return NextResponse.json({
    orderId: order.id,
    clientSecret: intent.client_secret,
    paymentIntentId: intent.id,
  });
}
