import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim().toLowerCase();
  const category = searchParams.get("category") || undefined;
  const size = searchParams.get("size") || undefined;
  const min = parseFloat(searchParams.get("min") || "0");
  const max = parseFloat(searchParams.get("max") || "100000");

  const where: any = {
    priceCents: { gte: Math.round(min * 100), lte: Math.round(max * 100) },
  };
  if (category) where.category = { slug: category };
  if (size) where.sizes = { some: { label: size } };
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { brand: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  const products = await prisma.product.findMany({
    where,
    take: 30,
    orderBy: { createdAt: "desc" },
    include: { images: { orderBy: { position: "asc" }, take: 1 } },
  });
  const items = products.map((p: (typeof products)[number]) => ({
    id: p.id,
    name: p.name,
    priceCents: p.priceCents,
    price: p.priceCents / 100, // legacy
    image: p.images[0]?.url,
  }));
  return NextResponse.json({ items, total: items.length });
}
