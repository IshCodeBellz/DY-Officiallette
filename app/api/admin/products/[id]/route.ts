import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/server/authOptions";
import { prisma } from "@/lib/server/prisma";
import type { Prisma } from "@prisma/client";
import { z } from "zod";

const productUpdateSchema = z.object({
  sku: z.string().min(3),
  name: z.string().min(1),
  description: z.string().min(1),
  priceCents: z.number().int().positive(),
  brandId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  images: z
    .array(
      z.object({
        id: z.string().optional(),
        url: z.string().url(),
        alt: z.string().optional(),
        position: z.number().int().nonnegative().optional(),
      })
    )
    .min(1),
  sizes: z
    .array(
      z.object({
        id: z.string().optional(),
        label: z.string().min(1),
        stock: z.number().int().min(0),
      })
    )
    .optional(),
});

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const uid = (session?.user as any)?.id as string | undefined;
  if (!uid) return { error: "unauthorized" as const };
  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user?.isAdmin) return { error: "forbidden" as const };
  return { user };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if ("error" in admin)
    return NextResponse.json(
      { error: admin.error },
      { status: admin.error === "unauthorized" ? 401 : 403 }
    );
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: {
      images: { orderBy: { position: "asc" } },
      sizes: true,
      brand: true,
      category: true,
    },
  });
  if (!product)
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ product });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if ("error" in admin)
    return NextResponse.json(
      { error: admin.error },
      { status: admin.error === "unauthorized" ? 401 : 403 }
    );
  const existing = await prisma.product.findUnique({
    where: { id: params.id },
    select: { id: true, deletedAt: true },
  });
  if (!existing)
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (existing.deletedAt) return NextResponse.json({ ok: true });
  await prisma.product.update({
    where: { id: params.id },
    data: { deletedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if ("error" in admin)
    return NextResponse.json(
      { error: admin.error },
      { status: admin.error === "unauthorized" ? 401 : 403 }
    );
  const body = await req.json().catch(() => null);
  const parsed = productUpdateSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  const { images, sizes, ...rest } = parsed.data;
  // Server-side duplicate size label protection
  if (sizes) {
    const labels = sizes.map((s) => s.label.trim().toLowerCase());
    const dedup = new Set(labels);
    if (dedup.size !== labels.length) {
      return NextResponse.json({ error: "duplicate_sizes" }, { status: 400 });
    }
  }
  const existing = await prisma.product.findUnique({
    where: { id: params.id },
    select: { id: true, sku: true },
  });
  if (!existing)
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (rest.sku !== existing.sku) {
    const skuExists = await prisma.product.findUnique({
      where: { sku: rest.sku },
      select: { id: true },
    });
    if (skuExists)
      return NextResponse.json({ error: "sku_exists" }, { status: 409 });
  }
  // Full replace strategy for images & sizes for simplicity
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.productImage.deleteMany({ where: { productId: existing.id } });
    await tx.sizeVariant.deleteMany({ where: { productId: existing.id } });
    await tx.product.update({
      where: { id: existing.id },
      data: {
        ...rest,
        images: {
          create: images.map((im, idx) => ({
            url: im.url,
            alt: im.alt,
            position: im.position ?? idx,
          })),
        },
        sizes:
          sizes && sizes.length > 0
            ? {
                create: sizes.map((s) => ({
                  label: s.label.trim(),
                  stock: s.stock,
                })),
              }
            : undefined,
      },
    });
  });
  const updated = await prisma.product.findUnique({
    where: { id: params.id },
    include: {
      images: { orderBy: { position: "asc" } },
      sizes: true,
      brand: true,
      category: true,
    },
  });
  return NextResponse.json({ product: updated });
}
