import { NextRequest } from "next/server";
import { prisma } from "@/lib/server/prisma";

// Lightweight invocation helpers for route handlers without spinning up full Next server
export async function invokeGET(mod: any, url: string) {
  const req = new NextRequest(new URL(url, "http://localhost:3000"));
  return mod.GET(req);
}
export async function invokePOST(
  mod: any,
  url: string,
  body: any,
  headers: Record<string, string> = {}
) {
  const req = new NextRequest(new URL(url, "http://localhost:3000"), {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json", ...headers },
  } as any);
  return mod.POST(req as any);
}

export async function resetDb() {
  // Order of deletion respecting FKs
  await prisma.paymentRecord.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartLine.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.sizeVariant.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.category.deleteMany();
  await prisma.discountCode.deleteMany();
  await prisma.user.deleteMany();
}

export async function createBasicProduct(
  opts: { priceCents?: number; sizes?: string[] } = {}
) {
  const product = await prisma.product.create({
    data: {
      sku: "SKU" + Math.random().toString(36).slice(2, 8),
      name: "Test Product",
      description: "Desc",
      priceCents: opts.priceCents ?? 5000,
      sizes: {
        create: (opts.sizes || ["M"]).map((label) => ({ label, stock: 10 })),
      },
    },
    include: { sizes: true },
  });
  return product;
}

export async function ensureTestUserAndCart() {
  let user = await prisma.user.findUnique({ where: { id: "test-user" } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        id: "test-user",
        email: "test@example.com",
        passwordHash: "x",
        isAdmin: true,
      },
    });
  }
  let cart = await prisma.cart.findUnique({ where: { userId: user.id } });
  if (!cart) cart = await prisma.cart.create({ data: { userId: user.id } });
  return { user, cart };
}

export async function addLineToCart(
  productId: string,
  priceCents: number,
  size?: string,
  qty = 1
) {
  const { cart } = await ensureTestUserAndCart();
  return prisma.cartLine.create({
    data: {
      cartId: cart.id,
      productId,
      size: size || null,
      qty,
      priceCentsSnapshot: priceCents,
    },
  });
}

export async function createDiscountFixed(code: string, valueCents: number) {
  return prisma.discountCode.create({
    data: { code: code.toUpperCase(), kind: "FIXED", valueCents },
  });
}
export async function createDiscountPercent(code: string, percent: number) {
  return prisma.discountCode.create({
    data: { code: code.toUpperCase(), kind: "PERCENT", percent },
  });
}
