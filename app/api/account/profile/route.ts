import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/server/authOptions";
import { prisma } from "@/lib/server/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const uid = (session?.user as any)?.id as string | undefined;
  if (!uid)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body.name !== "string")
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  const name = body.name.trim().slice(0, 100);
  await prisma.user.update({
    where: { id: uid },
    data: { name: name || null },
  });
  return NextResponse.json({ ok: true });
}
