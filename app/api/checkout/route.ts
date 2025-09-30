import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/server/authOptions";
import { prisma } from "@/lib/server/prisma";
import { sendOrderConfirmation } from "@/lib/server/mailer";
import { z } from "zod";
import { rateLimit } from "@/lib/server/rateLimit";
import { debug } from "@/lib/server/debug";
import { withRequest } from "@/lib/server/logger";

// Basic Phase 3 draft checkout endpoint:
// 1. Reads authenticated user's cart
// 2. Validates stock (size variant stock) & captures snapshots
// 3. Creates Order + OrderItems inside a transaction
// 4. (Payment integration placeholder) returns order id & client summary
// 5. Leaves cart lines intact for now (could clear after successful payment capture later)

const addressSchema = z.object({
  fullName: z.string().min(1),
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  region: z.string().optional(),
  postalCode: z.string().min(1),
  country: z.string().min(2),
  phone: z.string().optional(),
});

const lineSchema = z.object({
  productId: z.string().min(5),
  size: z.string().min(1).optional(),
  qty: z.number().int().min(1).max(99),
});

const payloadSchema = z.object({
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  email: z.string().email().optional(),
  discountCode: z.string().trim().toUpperCase().optional(),
  idempotencyKey: z.string().min(8).max(100).optional(),
  // Optional fallback: client can send current cart lines so server can rebuild if persistence lagged
  lines: z.array(lineSchema).max(200).optional(),
});

export const POST = withRequest(async function POST(req: NextRequest) {
  let session: any = null;
  let uid: string | undefined;
  const testUser =
    process.env.NODE_ENV === "test" ? req.headers.get("x-test-user") : null;
  if (testUser) {
    uid = testUser;
    session = {
      user: { id: testUser, email: "test@example.com", isAdmin: true },
    };
  } else {
    session = await getServerSession(authOptions);
    uid = (session?.user as any)?.id as string | undefined;
  }
  if (!uid) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const bypassRate =
    process.env.NODE_ENV === "test" &&
    req.headers.get("x-test-bypass-rate-limit") === "1";
  if (!bypassRate && !rateLimit(`checkout:${ip}`, 15, 60_000)) {
    debug("CHECKOUT", "rate_limited");
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    debug("CHECKOUT", "invalid_payload", parsed.error.flatten());
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  // Load cart with product & size info
  let cart = await prisma.cart.findUnique({
    where: { userId: uid },
    include: { lines: { include: { product: { include: { sizes: true } } } } },
  });
  debug("CHECKOUT", "loaded_cart", {
    user: uid,
    cartId: cart?.id,
    lines: cart?.lines.length,
  });
  if (!cart || cart.lines.length === 0) {
    // Attempt fallback rebuild if client provided lines (recent sync race)
    if (parsed.success && parsed.data.lines && parsed.data.lines.length) {
      debug("CHECKOUT", "rebuild_cart_attempt", {
        count: parsed.data.lines.length,
      });
      // Get or create cart record
      cart = await prisma.cart.upsert({
        where: { userId: uid },
        update: {},
        create: { userId: uid },
        include: {
          lines: { include: { product: { include: { sizes: true } } } },
        },
      });
      // Clear any existing (should be zero) then recreate
      await prisma.cartLine.deleteMany({ where: { cartId: cart.id } });
      for (const l of parsed.data.lines) {
        const product = await prisma.product.findUnique({
          where: { id: l.productId },
          include: { sizes: true },
        });
        if (!product || product.deletedAt) continue;
        let finalQty = l.qty;
        if (l.size) {
          const sv = product.sizes.find((s) => s.label === l.size);
          if (!sv) continue;
          finalQty = Math.min(finalQty, sv.stock, 99);
          if (finalQty <= 0) continue;
        } else {
          finalQty = Math.min(finalQty, 99);
        }
        await prisma.cartLine.create({
          data: {
            cartId: cart.id,
            productId: product.id,
            size: l.size,
            qty: finalQty,
            priceCentsSnapshot: product.priceCents,
          },
        });
      }
      cart = await prisma.cart.findUnique({
        where: { userId: uid },
        include: {
          lines: { include: { product: { include: { sizes: true } } } },
        },
      });
      debug("CHECKOUT", "rebuild_cart_result", { lines: cart?.lines.length });
    }
    if (!cart || cart.lines.length === 0) {
      debug("CHECKOUT", "empty_cart");
      return NextResponse.json({ error: "empty_cart" }, { status: 400 });
    }
  }

  // Validate stock + compute totals
  let subtotal = 0;
  const stockErrors: Array<{
    productId: string;
    size?: string;
    available: number;
  }> = [];
  for (const line of cart.lines) {
    const product = line.product;
    if (product.deletedAt) {
      stockErrors.push({
        productId: product.id,
        size: line.size || undefined,
        available: 0,
      });
      continue;
    }
    const sizeVariant = line.size
      ? product.sizes.find((s) => s.label === line.size)
      : undefined;
    const available = sizeVariant ? sizeVariant.stock : 999999; // if no size tracked assume plentiful
    if (line.qty > available) {
      stockErrors.push({
        productId: product.id,
        size: line.size || undefined,
        available,
      });
      continue;
    }
    subtotal += line.priceCentsSnapshot * line.qty;
  }
  if (stockErrors.length) {
    debug("CHECKOUT", "stock_conflict", stockErrors);
    return NextResponse.json(
      { error: "stock_conflict", stockErrors },
      { status: 409 }
    );
  }

  const {
    shippingAddress,
    billingAddress,
    email,
    discountCode,
    idempotencyKey,
  } = parsed.data;

  if (idempotencyKey) {
    const existing = await prisma.order.findFirst({
      where: {
        userId: uid,
        checkoutIdempotencyKey: idempotencyKey,
      } as any, // cast due to incremental type mismatch after recent migration
    });
    if (existing) {
      return NextResponse.json({
        orderId: existing.id,
        status: existing.status,
        subtotalCents: existing.subtotalCents,
        discountCents: existing.discountCents,
        totalCents: existing.totalCents,
        currency: existing.currency,
        idempotent: true,
      });
    }
  }

  // Discount code application
  let discountCents = 0;
  let discountMeta: {
    id?: string;
    code?: string;
    valueCents?: number;
    percent?: number;
  } = {};
  if (discountCode) {
    const now = new Date();
    const dc = await prisma.discountCode.findUnique({
      where: { code: discountCode.toUpperCase() },
    });
    if (dc && dc.startsAt && dc.startsAt > now) {
      debug("CHECKOUT", "discount_not_started");
      return NextResponse.json({ error: "invalid_discount" }, { status: 400 });
    }
    if (dc && dc.endsAt && dc.endsAt < now) {
      debug("CHECKOUT", "discount_expired");
      return NextResponse.json({ error: "invalid_discount" }, { status: 400 });
    }
    if (!dc) {
      debug("CHECKOUT", "invalid_discount", discountCode);
      return NextResponse.json({ error: "invalid_discount" }, { status: 400 });
    }
    if (dc.minSubtotalCents && subtotal < dc.minSubtotalCents) {
      debug("CHECKOUT", "discount_min_subtotal", {
        subtotal,
        required: dc.minSubtotalCents,
      });
      return NextResponse.json(
        { error: "discount_min_subtotal", required: dc.minSubtotalCents },
        { status: 400 }
      );
    }
    if (dc.usageLimit && dc.timesUsed >= dc.usageLimit) {
      debug("CHECKOUT", "discount_exhausted");
      return NextResponse.json(
        { error: "discount_exhausted" },
        { status: 400 }
      );
    }
    if (dc.kind === "FIXED" && dc.valueCents) {
      discountCents = Math.min(subtotal, dc.valueCents);
      discountMeta = { id: dc.id, code: dc.code, valueCents: dc.valueCents };
    } else if (dc.kind === "PERCENT" && dc.percent) {
      discountCents = Math.min(
        subtotal,
        Math.floor((subtotal * dc.percent) / 100)
      );
      discountMeta = { id: dc.id, code: dc.code, percent: dc.percent };
    }
  }

  const taxCents = Math.round(subtotal * 0.0); // placeholder
  const shippingCents = 0;
  const totalCents = subtotal - discountCents + taxCents + shippingCents;

  let result;
  try {
  result = await prisma.$transaction(async (tx) => {
    const shipping = await tx.address.create({
      data: { ...shippingAddress, userId: uid },
    });
    let billing = shipping;
    if (billingAddress) {
      billing = await tx.address.create({
        data: { ...billingAddress, userId: uid },
      });
    }

    const order = await tx.order.create({
      data: {
        userId: uid,
        status: "AWAITING_PAYMENT",
        checkoutIdempotencyKey: idempotencyKey,
        subtotalCents: subtotal,
        discountCents,
        taxCents,
        shippingCents,
        totalCents,
        email:
          email ||
          (session?.user?.email as string) ||
          shippingAddress.fullName + "@example.local",
        shippingAddressId: shipping.id,
        billingAddressId: billing.id,
        discountCodeId: discountMeta.id,
        discountCodeCode: discountMeta.code,
        discountCodeValueCents: discountMeta.valueCents,
        discountCodePercent: discountMeta.percent,
      },
    });

      for (const line of cart.lines) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: line.productId,
            sku: line.product.sku,
            nameSnapshot: line.product.name,
            size: line.size || null,
            qty: line.qty,
            unitPriceCents: line.priceCentsSnapshot,
            lineTotalCents: line.priceCentsSnapshot * line.qty,
          },
        });
        if (line.size) {
          const sizeVariant = line.product.sizes.find(
            (s) => s.label === line.size
          );
          if (sizeVariant) {
            // Atomic conditional decrement to avoid race oversell
            const affected = await tx.$executeRawUnsafe(
              `UPDATE SizeVariant SET stock = stock - ? WHERE id = ? AND stock >= ?`,
              line.qty,
              sizeVariant.id,
              line.qty
            );
            if (!affected) {
              throw new Error("STOCK_RACE_CONFLICT");
            }
          }
        }
      }

    if (discountMeta.id) {
      await tx.discountCode.update({
        where: { id: discountMeta.id },
        data: { timesUsed: { increment: 1 } },
      });
    }

    // Create a pending payment record placeholder (simulated intent id for now)
    await tx.paymentRecord.create({
      data: {
        orderId: order.id,
        provider: "STRIPE",
        providerRef: `pi_sim_${order.id}`,
        amountCents: order.totalCents,
        status: "PAYMENT_PENDING",
      },
    });
    return order;
  });
  } catch (e: any) {
    if (e?.message === "STOCK_RACE_CONFLICT") {
      debug("CHECKOUT", "stock_race_conflict");
      return NextResponse.json({ error: "stock_conflict" }, { status: 409 });
    }
    throw e;
  }

  // Fire and forget (no await needed) but we purposely await to surface errors in development
  if (session && session.user?.email && !testUser) {
    try {
      const userId = (session.user as any).id as string | undefined;
      if (userId) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user) await sendOrderConfirmation(user, result);
      }
    } catch (e) {
      console.error("order confirmation email failed", e);
    }
  }
  // TODO: invoke payment intent creation (Stripe) here and update order.status => AWAITING_PAYMENT

  return NextResponse.json({
    orderId: result.id,
    status: result.status,
    subtotalCents: result.subtotalCents,
    discountCents,
    totalCents: result.totalCents,
    currency: result.currency,
  });
});
