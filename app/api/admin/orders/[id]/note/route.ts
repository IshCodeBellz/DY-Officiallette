import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/server/authOptions";
import { prisma } from "@/lib/server/prisma";
import { withRequest } from "@/lib/server/logger";

export const dynamic = 'force-dynamic';

// POST /api/admin/orders/:id/note { message }
export const POST = withRequest(async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  let session: any = await getServerSession(authOptions);
  const testUser =
    process.env.NODE_ENV === "test" ? req.headers.get("x-test-user") : null;
  if (testUser) {
    session = {
      user: { id: testUser, email: "test@example.com", isAdmin: true },
    };
  }
  if (!(session?.user as any)?.isAdmin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body.message !== "string" || !body.message.trim()) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }
  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return NextResponse.json({ error: "not_found" }, { status: 404 });
  await (prisma as any).orderEvent.create({
    data: {
      orderId: order.id,
      kind: "NOTE",
      message: body.message.trim().slice(0, 500),
      meta: JSON.stringify({ authorId: (session.user as any).id }),
    },
  });
  return NextResponse.json({ ok: true });
});
