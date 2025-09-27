import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const category = searchParams.get("category") || undefined;
  const size = searchParams.get("size") || undefined;
  const min = parseFloat(searchParams.get("min") || "0");
  const max = parseFloat(searchParams.get("max") || "1000000");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const pageSize = Math.min(
    60,
    Math.max(1, parseInt(searchParams.get("pageSize") || "24"))
  );

  const where: any = {
    priceCents: { gte: Math.round(min * 100), lte: Math.round(max * 100) },
  };
  if (category) where.category = { slug: category };
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { brand: { name: { contains: q, mode: "insensitive" } } },
    ];
  }
  if (size) {
    where.sizes = { some: { label: size } };
  }

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        images: { orderBy: { position: "asc" }, take: 1 },
        brand: true,
        category: true,
        sizes: size ? { where: { label: size }, take: 1 } : false,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    total,
    page,
    pageSize,
    items: products.map((p: any) => ({
      id: p.id,
      name: p.name,
      priceCents: p.priceCents,
      price: p.priceCents / 100, // legacy field (consider removing later)
      image: p.images[0]?.url,
      brand: p.brand?.name,
      category: p.category?.slug,
      sizes: Array.isArray(p.sizes)
        ? p.sizes.map((s: any) => s.label)
        : undefined,
    })),
  });
}
