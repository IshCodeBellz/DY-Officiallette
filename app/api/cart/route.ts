import { NextRequest, NextResponse } from "next/server";
import { withRequest } from "@/lib/server/logger";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/server/authOptions";
import { prisma } from "@/lib/server/prisma";
import { z } from "zod";
import { ExtendedSession } from "@/lib/types";

interface CartLine {
  productId: string;
  size: string | null;
  qty: number;
  priceCentsSnapshot: number;
}

export const dynamic = "force-dynamic";

const lineSchema = z.object({
  productId: z.string(),
  size: z.string().optional(),
  qty: z.number().int().min(1).max(99),
});
const payloadSchema = z.object({ lines: z.array(lineSchema) });

async function getOrCreateCart(userId: string) {
  // userId is unique on Cart so we can use findUnique
  let cart = await prisma.cart.findUnique({
    where: { userId },
    include: { lines: true },
  });
  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
      include: { lines: true },
    });
  }
  return cart;
}

export const GET = withRequest(async function GET() {
  const session = (await getServerSession(
    authOptions
  )) as ExtendedSession | null;
  const uid = session?.user?.id;
  if (!uid) return NextResponse.json({ lines: [] });
  const cart = await prisma.cart.findUnique({
    where: { userId: uid },
    include: { lines: true },
  });
  return NextResponse.json({
    lines: (cart?.lines || []).map((l: CartLine) => ({
      productId: l.productId,
      size: l.size || undefined,
      qty: l.qty,
      priceCentsSnapshot: l.priceCentsSnapshot,
    })),
  });
});

// Replace cart
export const POST = withRequest(async function POST(req: NextRequest) {
  const session = (await getServerSession(
    authOptions
  )) as ExtendedSession | null;
  const uid = session?.user?.id;
  if (!uid)
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  const cart = await getOrCreateCart(uid);
  // Delete existing lines
  await prisma.cartLine.deleteMany({ where: { cartId: cart.id } });
  // Re-create
  const data = await Promise.all(
    parsed.data.lines.map(async (l) => {
      const product = await prisma.product.findUnique({
        where: { id: l.productId },
        include: { sizeVariants: true },
      });
      if (!product) return null;
      if (product.deletedAt) return null;
      let finalQty = l.qty;
      if (l.size) {
        const sv = product.sizeVariants.find((s) => s.label === l.size);
        if (!sv) return null;
        finalQty = Math.min(finalQty, sv.stock, 99);
        if (finalQty <= 0) return null;
      } else {
        finalQty = Math.min(finalQty, 99);
      }
      return prisma.cartLine.create({
        data: {
          cartId: cart.id,
          productId: product.id,
          size: l.size,
          qty: finalQty,
          priceCentsSnapshot: product.priceCents,
        },
      });
    })
  );
  return NextResponse.json({ ok: true, created: data.filter(Boolean).length });
});

// Merge cart (accumulate qty)
export const PATCH = withRequest(async function PATCH(req: NextRequest) {
  const session = (await getServerSession(
    authOptions
  )) as ExtendedSession | null;
  const uid = session?.user?.id;
  if (!uid)
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  const cart = await getOrCreateCart(uid);
  for (const l of parsed.data.lines) {
    const product = await prisma.product.findUnique({
      where: { id: l.productId },
      include: { sizeVariants: true },
    });
    if (!product) continue;
    if (product.deletedAt) continue;
    const existing = await prisma.cartLine.findFirst({
      where: { cartId: cart.id, productId: l.productId, size: l.size || null },
    });
    let finalQty = l.qty;
    if (l.size) {
      const sv = product.sizeVariants.find((s) => s.label === l.size);
      if (!sv) continue;
      const base = existing ? existing.qty + l.qty : l.qty;
      finalQty = Math.min(base, sv.stock, 99);
      if (finalQty <= 0) continue;
    } else {
      const base = existing ? existing.qty + l.qty : l.qty;
      finalQty = Math.min(base, 99);
    }
    if (existing) {
      await prisma.cartLine.update({
        where: { id: existing.id },
        data: { qty: finalQty },
      });
    } else {
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
  }
  const merged = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: { lines: true },
  });
  return NextResponse.json({
    lines:
      merged?.lines.map((l: CartLine) => ({
        productId: l.productId,
        size: l.size || undefined,
        qty: l.qty,
        priceCentsSnapshot: l.priceCentsSnapshot,
      })) || [],
  });
});
