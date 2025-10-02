import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/server/authOptions";
import { prisma } from "@/lib/server/prisma";
import { withRequest } from "@/lib/server/logger";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const productSchema = z.object({
  sku: z.string().min(3),
  name: z.string().min(1),
  description: z.string().min(1),
  priceCents: z.number().int().positive(),
  brandId: z.string().optional(),
  categoryId: z.string().optional(),
  images: z
    .array(
      z.object({
        url: z.string().url(),
        alt: z.string().optional(),
        position: z.number().int().nonnegative().optional(),
      })
    )
    .min(1),
  sizes: z
    .array(
      z.object({ label: z.string().min(1), stock: z.number().int().min(0) })
    )
    .optional(),
});

export const POST = withRequest(async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const uid = (session?.user as any)?.id as string | undefined;
  if (!uid)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user?.isAdmin)
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }
  const { images, sizes, ...rest } = parsed.data;
  // Prevent duplicate SKU
  const existing = await prisma.product.findUnique({
    where: { sku: rest.sku },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ error: "sku_exists" }, { status: 409 });
  }
  const created = await prisma.product.create({
    data: {
      sku: rest.sku,
      name: rest.name,
      description: rest.description,
      priceCents: rest.priceCents,
      brand: rest.brandId ? { connect: { id: rest.brandId } } : undefined,
      category: rest.categoryId
        ? { connect: { id: rest.categoryId } }
        : undefined,
      images: {
        create: images.map((i, idx) => ({ ...i, position: i.position ?? idx })),
      },
      sizeVariants: sizes ? { create: sizes } : undefined,
    },
    include: { images: true, sizeVariants: true },
  });
  return NextResponse.json({ product: created }, { status: 201 });
});

export const GET = withRequest(async function GET() {
  // Simple list for admin UI scaffolding (limit 50 newest)
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      sku: true,
      name: true,
      priceCents: true,
      createdAt: true,
      _count: { select: { images: true, sizeVariants: true } },
    },
  });
  return NextResponse.json({ products });
});
