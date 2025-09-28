import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/server/authOptions";
import { prisma } from "@/lib/server/prisma";

// GET /api/orders/:id - detail for current user's order (includes items & addresses)
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const uid = (session?.user as any)?.id as string | undefined;
  if (!uid)
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  const order = await prisma.order.findFirst({
    where: { id: params.id, userId: uid },
    include: {
      items: true,
      shippingAddress: true,
      billingAddress: true,
      payments: {
        select: {
          id: true,
          provider: true,
          status: true,
          amountCents: true,
          currency: true,
          createdAt: true,
        },
      },
    },
  });
  if (!order) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ order });
}
