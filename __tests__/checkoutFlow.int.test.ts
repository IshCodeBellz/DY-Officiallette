/**
 * Integration-ish test (runs in Jest environment) for checkout + payment + webhook.
 * Assumes prisma points to a test SQLite db (set DATABASE_URL before running tests).
 */
import { prisma } from "@/lib/server/prisma";

async function seedProduct(name: string, sku: string, priceCents = 5000) {
  return prisma.product.create({
    data: {
      name,
      sku,
      description: name + " desc",
      priceCents,
      images: { create: { url: "/test.png", position: 0 } },
    },
    include: { images: true },
  });
}

describe("checkout payment flow", () => {
  const userId = "test-user-checkout-flow";
  beforeAll(async () => {
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartLine.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.productImage.deleteMany();
    await prisma.product.deleteMany();
  });

  it("creates order, payment intent, and finalizes via webhook", async () => {
    const p1 = await seedProduct("Flow Product 1", "FLOW-001", 1200);
    await prisma.cart.create({
      data: {
        userId,
        lines: {
          create: {
            productId: p1.id,
            qty: 2,
            priceCentsSnapshot: p1.priceCents,
          },
        },
      },
    });

    // Checkout start
    const checkoutRes = await fetch("http://localhost:3000/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-test-user": userId,
        "x-test-bypass-rate-limit": "1",
      },
      body: JSON.stringify({
        shippingAddress: {
          fullName: "Test User",
          line1: "123 St",
          city: "Town",
          postalCode: "12345",
          country: "US",
        },
        idempotencyKey: "idem-1234",
      }),
    });
    expect(checkoutRes.status).toBe(200);
    const checkoutData = await checkoutRes.json();
    expect(checkoutData.orderId).toBeTruthy();

    // Payment intent
    const payRes = await fetch("http://localhost:3000/api/payments/intent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-test-user": userId,
      },
      body: JSON.stringify({ orderId: checkoutData.orderId }),
    });
    expect(payRes.status).toBe(200);
    const payData = await payRes.json();
    expect(payData.clientSecret).toBeTruthy();

    // Simulate webhook
    const webhookRes = await fetch(
      "http://localhost:3000/api/webhooks/stripe",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "payment_intent.succeeded",
          data: {
            object: {
              id: payData.paymentIntentId,
              metadata: { orderId: checkoutData.orderId },
            },
          },
        }),
      }
    );
    expect(webhookRes.status).toBe(200);
    const updated = await prisma.order.findUnique({
      where: { id: checkoutData.orderId },
    });
    expect(updated?.status).toBe("PAID");
    // Metrics updated
    const rows: any[] = await prisma.$queryRawUnsafe(
      "SELECT purchases FROM ProductMetrics WHERE productId = ? LIMIT 1",
      p1.id
    );
    expect(rows[0]?.purchases || 0).toBeGreaterThanOrEqual(1);
  });
});
