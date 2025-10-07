import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/server/authOptions";
import { prisma } from "@/lib/server/prisma";

export const dynamic = 'force-dynamic';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const uid = (session?.user as any)?.id as string | undefined;
  if (!uid)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user?.isAdmin)
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const existing = await prisma.product.findUnique({
    where: { id: params.id },
    select: { id: true, deletedAt: true },
  });
  if (!existing)
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!existing.deletedAt) return NextResponse.json({ ok: true });
  await prisma.product.update({
    where: { id: params.id },
    data: { deletedAt: null },
  });
  return NextResponse.json({ ok: true });
}
