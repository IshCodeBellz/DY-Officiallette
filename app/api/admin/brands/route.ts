import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/server/authOptions";
import { prisma } from "@/lib/server/prisma";
import { z } from "zod";

const brandSchema = z.object({ name: z.string().min(2).max(80) });

async function ensureAdmin() {
  const session = await getServerSession(authOptions);
  const uid = (session?.user as any)?.id as string | undefined;
  if (!uid) return null;
  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user?.isAdmin) return null;
  return user;
}

export async function GET() {
  const admin = await ensureAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const brands = await prisma.brand.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ brands });
}

export async function POST(req: NextRequest) {
  const admin = await ensureAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = await req.json().catch(() => null);
  const parsed = brandSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  const exists = await prisma.brand.findFirst({
    where: { name: parsed.data.name },
  });
  if (exists)
    return NextResponse.json({ error: "name_exists" }, { status: 409 });
  const created = await prisma.brand.create({
    data: { name: parsed.data.name },
  });
  return NextResponse.json({ brand: created }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const admin = await ensureAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = await req.json().catch(() => null);
  const schema = z.object({
    id: z.string().length(25),
    name: z.string().min(2).max(80),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  const { id, name } = parsed.data;
  const updated = await prisma.brand
    .update({ where: { id }, data: { name } })
    .catch(() => null);
  if (!updated)
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ brand: updated });
}

export async function DELETE(req: NextRequest) {
  const admin = await ensureAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });
  // Prevent delete if linked products exist
  const count = await prisma.product.count({ where: { brandId: id } });
  if (count > 0) return NextResponse.json({ error: "in_use" }, { status: 409 });
  const deleted = await prisma.brand
    .delete({ where: { id } })
    .catch(() => null);
  if (!deleted)
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
