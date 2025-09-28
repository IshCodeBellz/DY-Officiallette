import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/server/authOptions";
import { prisma } from "@/lib/server/prisma";
import { z } from "zod";

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
  phone: z.string().optional()
});

const payloadSchema = z.object({
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  email: z.string().email().optional(),
  // future: discountCode, shippingMethod, paymentMethod
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const uid = (session?.user as any)?.id as string | undefined;
  if (!uid) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

  // Load cart with product & size info
  const cart = await prisma.cart.findUnique({
    where: { userId: uid },
    include: { lines: { include: { product: { include: { sizes: true } } } } }
  });
  if (!cart || cart.lines.length === 0) {
    return NextResponse.json({ error: "empty_cart" }, { status: 400 });
  }

  // Validate stock + compute totals
  let subtotal = 0;
  const stockErrors: Array<{ productId: string; size?: string; available: number }> = [];
  for (const line of cart.lines) {
    const product = line.product;
    if (product.deletedAt) {
      stockErrors.push({ productId: product.id, size: line.size || undefined, available: 0 });
      continue;
    }
    const sizeVariant = line.size ? product.sizes.find(s => s.label === line.size) : undefined;
    const available = sizeVariant ? sizeVariant.stock : 999999; // if no size tracked assume plentiful
    if (line.qty > available) {
      stockErrors.push({ productId: product.id, size: line.size || undefined, available });
      continue;
    }
    subtotal += line.priceCentsSnapshot * line.qty;
  }
  if (stockErrors.length) {
    return NextResponse.json({ error: "stock_conflict", stockErrors }, { status: 409 });
  }

  // Placeholder tax/shipping calculations
  const discountCents = 0;
  const taxCents = Math.round(subtotal * 0.0); // later: proper tax logic
  const shippingCents = 0; // later: shipping method based
  const totalCents = subtotal - discountCents + taxCents + shippingCents;

  const { shippingAddress, billingAddress, email } = parsed.data;

  const result = await prisma.$transaction(async (tx) => {
    // persist addresses (deduplicate by simple fingerprint later)
    const shipping = await tx.address.create({ data: { ...shippingAddress, userId: uid } });
    let billing = shipping;
    if (billingAddress) {
      billing = await tx.address.create({ data: { ...billingAddress, userId: uid } });
    }

    const order = await tx.order.create({
      data: {
        userId: uid,
        status: "PENDING",
        subtotalCents: subtotal,
        discountCents,
        taxCents,
        shippingCents,
        totalCents,
        email: email || (session?.user?.email as string) || shippingAddress.fullName + "@example.local",
        shippingAddressId: shipping.id,
        billingAddressId: billing.id
      }
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
          lineTotalCents: line.priceCentsSnapshot * line.qty
        }
      });
      // decrement stock if size variant present
      if (line.size) {
        const sizeVariant = line.product.sizes.find(s => s.label === line.size);
        if (sizeVariant) {
          await tx.sizeVariant.update({
            where: { id: sizeVariant.id },
            data: { stock: Math.max(0, sizeVariant.stock - line.qty) }
          });
        }
      }
    }

    return order;
  });

  // TODO: invoke payment intent creation (Stripe) here and update order.status => AWAITING_PAYMENT

  return NextResponse.json({
    orderId: result.id,
    status: result.status,
    subtotalCents: result.subtotalCents,
    totalCents: result.totalCents,
    currency: result.currency
  });
}
