import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/server/authOptions";
import { prisma } from "@/lib/server/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);
  const uid = (session?.user as any)?.id as string | undefined;
  if (!uid)
    return <div className="p-6">Please log in to view your orders.</div>;
  const orders = await prisma.order.findMany({
    where: { userId: uid },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      totalCents: true,
      createdAt: true,
      currency: true,
    },
  });
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Your Orders</h1>
      {orders.length === 0 && <p>No orders yet.</p>}
      <ul className="space-y-2">
        {orders.map((o) => (
          <li
            key={o.id}
            className="border rounded p-3 flex justify-between items-center"
          >
            <div>
              <div className="font-medium">Order #{o.id.slice(0, 8)}</div>
              <div className="text-sm text-neutral-500">
                {o.status} • {new Date(o.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-mono">
                {(o.totalCents / 100).toFixed(2)} {o.currency}
              </span>
              <Link
                href={`/account/orders/${o.id}`}
                className="text-blue-600 hover:underline text-sm"
              >
                View
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
