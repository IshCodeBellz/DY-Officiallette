import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const idsParam = (searchParams.get("ids") || "").trim();
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

  // If ids param provided -> fetch a specific set, preserve ordering
  if (idsParam) {
    const ids = idsParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 50); // safety cap
    if (ids.length === 0) {
      return NextResponse.json({ total: 0, page: 1, pageSize: ids.length, items: [] });
    }
    const products = await prisma.product.findMany({
      where: { id: { in: ids } },
      include: {
        images: { orderBy: { position: "asc" }, take: 1 },
        brand: true,
        category: true,
      },
    });
    const map = new Map(products.map((p: any) => [p.id, p]));
    return NextResponse.json({
      total: products.length,
      page: 1,
      pageSize: products.length,
      items: ids
        .map((id) => map.get(id))
        .filter(Boolean)
        .map((p: any) => ({
          id: p.id,
            name: p.name,
            priceCents: p.priceCents,
            price: p.priceCents / 100,
            image: p.images[0]?.url,
            brand: p.brand?.name,
            category: p.category?.slug,
        })),
    });
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
