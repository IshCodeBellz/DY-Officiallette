import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/server/authOptions";
import { prisma } from "@/lib/server/prisma";
import { z } from "zod";

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

export async function GET() {
  const session = await getServerSession(authOptions);
  const uid = (session?.user as any)?.id as string | undefined;
  if (!uid) return NextResponse.json({ lines: [] });
  const cart = await prisma.cart.findUnique({
    where: { userId: uid },
    include: { lines: true },
  });
  return NextResponse.json({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lines: (cart?.lines || []).map((l: any) => ({
      productId: l.productId,
      size: l.size || undefined,
      qty: l.qty,
      priceCentsSnapshot: l.priceCentsSnapshot,
    })),
  });
}

// Replace cart
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const uid = (session?.user as any)?.id as string | undefined;
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
      });
      if (!product) return null;
      return prisma.cartLine.create({
        data: {
          cartId: cart.id,
          productId: product.id,
          size: l.size,
          qty: l.qty,
          priceCentsSnapshot: product.priceCents,
        },
      });
    })
  );
  return NextResponse.json({ ok: true, created: data.filter(Boolean).length });
}

// Merge cart (accumulate qty)
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const uid = (session?.user as any)?.id as string | undefined;
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
    });
    if (!product) continue;
    const existing = await prisma.cartLine.findFirst({
      where: { cartId: cart.id, productId: l.productId, size: l.size || null },
    });
    if (existing) {
      await prisma.cartLine.update({
        where: { id: existing.id },
        data: { qty: Math.min(99, existing.qty + l.qty) },
      });
    } else {
      await prisma.cartLine.create({
        data: {
          cartId: cart.id,
          productId: product.id,
          size: l.size,
          qty: l.qty,
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lines:
      merged?.lines.map((l: any) => ({
        productId: l.productId,
        size: l.size || undefined,
        qty: l.qty,
        priceCentsSnapshot: l.priceCentsSnapshot,
      })) || [],
  });
}
