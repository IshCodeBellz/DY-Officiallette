import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/server/authOptions";
import { prisma } from "@/lib/server/prisma";

// GET /api/orders - list current user's orders (most recent first)
export async function GET() {
  const session = await getServerSession(authOptions);
  const uid = (session?.user as any)?.id as string | undefined;
  if (!uid) return NextResponse.json({ orders: [] });
  const orders = await prisma.order.findMany({
    where: { userId: uid },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      totalCents: true,
      subtotalCents: true,
      createdAt: true,
      currency: true,
      paidAt: true,
      cancelledAt: true
    }
  });
  return NextResponse.json({ orders });
}
