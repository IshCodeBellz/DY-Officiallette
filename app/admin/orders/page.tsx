import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/server/authOptions";
import { prisma } from "@/lib/server/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

const ALLOWED = [
  "PENDING",
  "AWAITING_PAYMENT",
  "PAID",
  "FULFILLING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams?: { status?: string };
}) {
  const session = await getServerSession(authOptions);
  const isAdmin = (session?.user as any)?.isAdmin;
  if (!isAdmin) return <div className="p-6">Unauthorized</div>;
  const status =
    searchParams?.status && ALLOWED.includes(searchParams.status)
      ? searchParams.status
      : undefined;
  const orders = await prisma.order.findMany({
    where: { status: status || undefined },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      status: true,
      totalCents: true,
      createdAt: true,
      currency: true,
      email: true,
      paidAt: true,
    },
  });
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Orders (Admin)</h1>
      <div className="flex gap-2 flex-wrap text-sm">
        <Link
          href="/admin/orders"
          className={!status ? "font-semibold underline" : ""}
        >
          All
        </Link>
        {ALLOWED.map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}`}
            className={status === s ? "font-semibold underline" : ""}
          >
            {s}
          </Link>
        ))}
      </div>
      <table className="w-full text-sm border">
        <thead>
          <tr className="bg-neutral-100 text-left">
            <th className="p-2">Order</th>
            <th className="p-2">Status</th>
            <th className="p-2">Total</th>
            <th className="p-2">Customer</th>
            <th className="p-2">Paid</th>
            <th className="p-2">Update</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-t">
              <td className="p-2 font-mono text-xs">{o.id.slice(0, 8)}</td>
              <td className="p-2">{o.status}</td>
              <td className="p-2">
                {(o.totalCents / 100).toFixed(2)} {o.currency}
              </td>
              <td className="p-2">{o.email}</td>
              <td className="p-2">
                {o.paidAt ? new Date(o.paidAt).toLocaleDateString() : "-"}
              </td>
              <td className="p-2">
                <form
                  action={`/api/admin/orders/${o.id}/status`}
                  method="post"
                  className="flex gap-1 items-center"
                >
                  <select
                    name="status"
                    defaultValue={o.status}
                    className="border rounded px-1 py-0.5 text-xs"
                  >
                    {ALLOWED.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <button className="bg-blue-600 text-white px-2 py-0.5 rounded text-xs">
                    Save
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
