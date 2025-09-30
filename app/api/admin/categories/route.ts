import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/server/authOptions";
import { prisma } from "@/lib/server/prisma";
import { withRequest } from "@/lib/server/logger";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(2).max(80),
  slug: z
    .string()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/)
    .min(2)
    .max(80),
});

async function ensureAdmin() {
  const session = await getServerSession(authOptions);
  const uid = (session?.user as any)?.id as string | undefined;
  if (!uid) return null;
  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user?.isAdmin) return null;
  return user;
}

export const GET = withRequest(async function GET() {
  const admin = await ensureAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ categories });
});

export const POST = withRequest(async function POST(req: NextRequest) {
  const admin = await ensureAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = await req.json().catch(() => null);
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  const { slug, name } = parsed.data;
  const exists = await prisma.category.findFirst({
    where: { OR: [{ slug }, { name }] },
  });
  if (exists) return NextResponse.json({ error: "exists" }, { status: 409 });
  const created = await prisma.category.create({ data: { slug, name } });
  return NextResponse.json({ category: created }, { status: 201 });
});

export const PUT = withRequest(async function PUT(req: NextRequest) {
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
  const updated = await prisma.category
    .update({ where: { id }, data: { name } })
    .catch(() => null);
  if (!updated)
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ category: updated });
});

export const DELETE = withRequest(async function DELETE(req: NextRequest) {
  const admin = await ensureAdmin();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) return NextResponse.json({ error: "in_use" }, { status: 409 });
  const deleted = await prisma.category
    .delete({ where: { id } })
    .catch(() => null);
  if (!deleted)
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true });
});
