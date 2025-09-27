import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/server/authOptions";
import { prisma } from "@/lib/server/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const uid = (session?.user as any)?.id as string | undefined;
  if (!uid)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user?.isAdmin)
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const brand = searchParams.get("brand") || undefined;
  const category = searchParams.get("category") || undefined;
  const includeDeleted = searchParams.get("deleted") === "1";
  if (!q && !brand && !category) return NextResponse.json({ items: [] });
  const items = await prisma.product.findMany({
    where: {
      ...(includeDeleted ? {} : { deletedAt: null }),
      ...(brand ? { brandId: brand } : {}),
      ...(category ? { categoryId: category } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { sku: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      name: true,
      sku: true,
      priceCents: true,
      deletedAt: true,
    },
  });
  return NextResponse.json({ items });
}
