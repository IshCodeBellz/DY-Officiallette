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
  const sku = (searchParams.get("sku") || "").trim();
  const exclude = searchParams.get("exclude") || undefined;
  if (!sku) return NextResponse.json({ available: false, reason: "empty" });
  const existing = await prisma.product.findFirst({
    where: { sku, id: { not: exclude || "" } },
  });
  return NextResponse.json({ available: !existing });
}
