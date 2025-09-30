import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/server/authOptions";
import { prisma } from "@/lib/server/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  const uid = (session?.user as any)?.id as string | undefined;
  if (!uid) return <div className="p-6">Please log in.</div>;
  const order = await prisma.order.findFirst({
    where: { id: params.id, userId: uid },
    include: {
      items: true,
      shippingAddress: true,
      billingAddress: true,
      payments: true,
    },
  });
  const events: Array<{ id: string; kind: string; message: string | null; createdAt: Date; meta: string | null }> = order
    ? await (prisma as any).orderEvent.findMany({
        where: { orderId: order.id },
        orderBy: { createdAt: "asc" },
      })
    : [];
  if (!order) return <div className="p-6">Order not found.</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Order #{order.id.slice(0, 8)}</h1>
        <Link
          href="/account/orders"
          className="text-sm text-blue-600 hover:underline"
        >
          Back to orders
        </Link>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <h2 className="font-medium">Items</h2>
          <ul className="divide-y border rounded">
            {order.items.map((i) => (
              <li key={i.id} className="p-3 flex justify-between text-sm">
                <div>
                  <div className="font-medium">
                    {i.nameSnapshot}
                    {i.size ? ` / ${i.size}` : ""}
                  </div>
                  <div className="text-neutral-500">
                    Qty {i.qty} • Unit {(i.unitPriceCents / 100).toFixed(2)}
                  </div>
                </div>
                <div className="font-mono">
                  {(i.lineTotalCents / 100).toFixed(2)} {order.currency}
                </div>
              </li>
            ))}
          </ul>
          <div>
            <h2 className="font-medium mt-6">Timeline</h2>
            <ul className="mt-2 border rounded divide-y text-xs">
              {events.map((e) => (
                <li key={e.id} className="p-2 space-y-1">
                  <div className="flex justify-between"><span className="font-mono text-[10px] opacity-60">{e.createdAt.toISOString().slice(11,19)}</span><span className="font-semibold">{e.kind}</span></div>
                  {e.message && <div>{e.message}</div>}
                </li>
              ))}
              {events.length === 0 && (
                <li className="p-2 text-neutral-500">No events yet.</li>
              )}
            </ul>
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="font-medium">Summary</h2>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{(order.subtotalCents / 100).toFixed(2)}</span>
            </div>
            {order.discountCents > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-{(order.discountCents / 100).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Tax</span>
              <span>{(order.taxCents / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{(order.shippingCents / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold border-t pt-1">
              <span>Total</span>
              <span>
                {(order.totalCents / 100).toFixed(2)} {order.currency}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Status</span>
              <span>{order.status}</span>
            </div>
          </div>
          <div>
            <h3 className="font-medium mt-4">Shipping Address</h3>
            <div className="text-xs whitespace-pre-line">
              {order.shippingAddress?.fullName}\n{order.shippingAddress?.line1}
              {order.shippingAddress?.line2
                ? `\n${order.shippingAddress.line2}`
                : ""}
              \n{order.shippingAddress?.city}{" "}
              {order.shippingAddress?.postalCode}\n
              {order.shippingAddress?.country}
            </div>
            <h3 className="font-medium mt-4">Billing Address</h3>
            <div className="text-xs whitespace-pre-line">
              {order.billingAddress?.fullName}\n{order.billingAddress?.line1}
              {order.billingAddress?.line2
                ? `\n${order.billingAddress.line2}`
                : ""}
              \n{order.billingAddress?.city} {order.billingAddress?.postalCode}
              \n{order.billingAddress?.country}
            </div>
          </div>
          <div>
            <h3 className="font-medium mt-4">Payments</h3>
            <ul className="text-xs space-y-1">
              {order.payments.map((p) => (
                <li key={p.id}>
                  [{p.status}] {p.provider} {(p.amountCents / 100).toFixed(2)}{" "}
                  {p.currency}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
