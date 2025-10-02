import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/server/authOptions";
import { prisma } from "@/lib/server/prisma";
import { withRequest } from "@/lib/server/logger";
import {
  OrderStatus,
  OrderTransitions,
  canTransition,
  isOrderStatus,
} from "@/lib/status";

export const POST = withRequest(async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Test harness bypass (mirrors pattern used in checkout & payment intent endpoints)
  let session: any = await getServerSession(authOptions);
  const testUser =
    process.env.NODE_ENV === "test" ? req.headers.get("x-test-user") : null;
  if (testUser) {
    session = {
      user: { id: testUser, email: "test@example.com", isAdmin: true },
    };
  }
  if (!(session?.user as any)?.isAdmin)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Accept both traditional form submission (existing admin UI) and JSON (tests)
  const contentType = req.headers.get("content-type") || "";
  let status: string | null = null;
  if (contentType.includes("application/json")) {
    const body = await req.json().catch(() => null);
    if (body && typeof body.status === "string") status = body.status;
  } else {
    const form = await req.formData().catch(() => null);
    const raw = form?.get("status");
    if (typeof raw === "string") status = raw;
  }

  if (typeof status !== "string" || !isOrderStatus(status)) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }
  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const current = order.status as keyof typeof OrderTransitions;
  const allowedNext = OrderTransitions[current] || [];
  if (!allowedNext.includes(status) && order.status !== status) {
    return NextResponse.json(
      { error: "invalid_transition", from: order.status, to: status },
      { status: 400 }
    );
  }
  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id: order.id }, data: { status } });
    await (tx as any).orderEvent.create({
      data: {
        orderId: order.id,
        kind: "STATUS_CHANGE",
        message: `Status ${order.status} -> ${status}`,
        meta: JSON.stringify({ from: order.status, to: status }),
      },
    });
  });
  return NextResponse.redirect(new URL("/admin/orders", req.url));
});
