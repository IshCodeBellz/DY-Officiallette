import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/server/authOptions";
import { prisma } from "@/lib/server/prisma";
import type { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import Link from "next/link";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const RestoreProductButton = require("./restoreButton").default as (props: {
  productId: string;
}) => JSX.Element;

// Revalidate dashboard every 60s (counts + low stock); remove if you prefer fully dynamic.
export const revalidate = 60;

export default async function AdminHomePage() {
  const session = await getServerSession(authOptions);
  const uid = (session?.user as any)?.id as string | undefined;
  if (!uid) redirect("/login?callbackUrl=/admin");
  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user?.isAdmin) redirect("/");

  const LOW_STOCK_THRESHOLD = 5; // adjust threshold as needed
  const [counts, recentProducts, lowStock, recentDeleted] = await Promise.all([
    // Use interactive transaction for a consistent snapshot of counts.
    // Remove explicit type annotation so Prisma's expected transactional client type is inferred.
    prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const productCount = await tx.product.count({
        where: { deletedAt: null },
      });
      const deletedCount = await tx.product.count({
        where: { deletedAt: { not: null } },
      });
      const brandCount = await tx.brand.count();
      const categoryCount = await tx.category.count();
      const userCount = await tx.user.count();
      return {
        productCount,
        deletedCount,
        brandCount,
        categoryCount,
        userCount,
      };
    }),
    prisma.product.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        sku: true,
        createdAt: true,
        priceCents: true,
      },
    }),
    prisma.sizeVariant.findMany({
      where: {
        stock: { lt: LOW_STOCK_THRESHOLD },
        product: { deletedAt: null },
      },
      include: { product: { select: { id: true, name: true, sku: true } } },
      orderBy: { stock: "asc" },
      take: 10,
    }),
    prisma.product.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: "desc" },
      take: 5,
      select: { id: true, name: true, sku: true, deletedAt: true },
    }),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">
          Admin Dashboard
        </h1>
        <Link
          href="/admin/products/new"
          className="text-sm rounded bg-neutral-900 text-white px-3 py-2 hover:bg-neutral-800"
        >
          New Product
        </Link>
      </div>
      <section className="space-y-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-600 mb-4">
          Overview
        </h2>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Active Products"
            value={counts.productCount}
            href="/admin/products"
          />
          <StatCard
            label="Deleted Products"
            value={counts.deletedCount}
            href="/admin/products?deleted=1"
          />
          <StatCard
            label="Brands"
            value={counts.brandCount}
            href="/admin/brands"
          />
          <StatCard
            label="Categories"
            value={counts.categoryCount}
            href="/admin/categories"
          />
          <StatCard label="Users" value={counts.userCount} />
        </div>
        <div className="flex flex-wrap gap-3 pt-2 text-sm">
          <Link href="/admin/products" className="underline hover:no-underline">
            Manage Products
          </Link>
          <Link href="/admin/brands" className="underline hover:no-underline">
            Manage Brands
          </Link>
          <Link
            href="/admin/categories"
            className="underline hover:no-underline"
          >
            Manage Categories
          </Link>
          <Link
            href="/admin/analytics"
            className="underline hover:no-underline"
          >
            Search Analytics
          </Link>
          <Link
            href="/admin/personalization"
            className="underline hover:no-underline"
          >
            Personalization
          </Link>
          <Link
            href="/admin/inventory"
            className="underline hover:no-underline"
          >
            Inventory Management
          </Link>
          <Link href="/admin/social" className="underline hover:no-underline">
            Social Commerce
          </Link>
          <Link
            href="/admin/users/analytics"
            className="underline hover:no-underline"
          >
            User Analytics
          </Link>
          <Link href="/admin/security" className="underline hover:no-underline">
            Security Management
          </Link>
          <Link href="/admin/settings" className="underline hover:no-underline">
            System Settings
          </Link>
        </div>
      </section>
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-600 mb-4">
          Recent Products
        </h2>
        <div className="border rounded overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left">
              <tr>
                <th className="py-2 px-3 font-medium">Name</th>
                <th className="py-2 px-3 font-medium">SKU</th>
                <th className="py-2 px-3 font-medium">Created</th>
                <th className="py-2 px-3 font-medium">Price</th>
                <th className="py-2 px-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {recentProducts.map(
                (p: {
                  id: string;
                  name: string;
                  sku: string;
                  createdAt: Date;
                  priceCents: number;
                }) => (
                  <tr
                    key={p.id}
                    className="border-t last:border-b hover:bg-neutral-50/70"
                  >
                    <td className="py-2 px-3">{p.name}</td>
                    <td className="py-2 px-3 font-mono text-xs">{p.sku}</td>
                    <td className="py-2 px-3 text-xs text-neutral-500">
                      {p.createdAt.toISOString().split("T")[0]}
                    </td>
                    <td className="py-2 px-3">
                      ${(p.priceCents / 100).toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="text-xs underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                )
              )}
              {recentProducts.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-6 text-center text-neutral-500 text-sm"
                  >
                    No products yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-600 mb-4">
          Low Stock ( &lt; {LOW_STOCK_THRESHOLD} )
        </h2>
        <div className="border rounded overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left">
              <tr>
                <th className="py-2 px-3 font-medium">Product</th>
                <th className="py-2 px-3 font-medium">SKU</th>
                <th className="py-2 px-3 font-medium">Size</th>
                <th className="py-2 px-3 font-medium">Stock</th>
                <th className="py-2 px-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {lowStock.map(
                (sv: {
                  id: string;
                  label: string;
                  stock: number;
                  product: { id: string; name: string; sku: string };
                }) => (
                  <tr
                    key={sv.id}
                    className="border-t last:border-b hover:bg-neutral-50/70"
                  >
                    <td className="py-2 px-3">{sv.product.name}</td>
                    <td className="py-2 px-3 font-mono text-[11px]">
                      {sv.product.sku}
                    </td>
                    <td className="py-2 px-3">{sv.label}</td>
                    <td
                      className={`py-2 px-3 font-semibold ${
                        sv.stock === 0 ? "text-red-600" : ""
                      }`}
                    >
                      {sv.stock}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <Link
                        href={`/admin/products/${sv.product.id}`}
                        className="text-xs underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                )
              )}
              {lowStock.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-6 text-center text-neutral-500 text-sm"
                  >
                    No low stock variants 🎉
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-600 mb-4">
          Recently Deleted
        </h2>
        <div className="border rounded overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left">
              <tr>
                <th className="py-2 px-3 font-medium">Name</th>
                <th className="py-2 px-3 font-medium">SKU</th>
                <th className="py-2 px-3 font-medium">Deleted</th>
                <th className="py-2 px-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {recentDeleted.map(
                (d: {
                  id: string;
                  name: string;
                  sku: string;
                  deletedAt: Date | null;
                }) => (
                  <tr
                    key={d.id}
                    className="border-t last:border-b hover:bg-neutral-50/70 opacity-70"
                  >
                    <td className="py-2 px-3">{d.name}</td>
                    <td className="py-2 px-3 font-mono text-[11px]">{d.sku}</td>
                    <td className="py-2 px-3 text-xs text-neutral-500">
                      {d.deletedAt?.toISOString().split("T")[0]}
                    </td>
                    <td className="py-2 px-3 text-right flex gap-2 justify-end">
                      <Link
                        href={`/admin/products/${d.id}`}
                        className="text-xs underline"
                      >
                        View
                      </Link>
                      <RestoreProductButton productId={d.id} />
                    </td>
                  </tr>
                )
              )}
              {recentDeleted.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="py-6 text-center text-neutral-500 text-sm"
                  >
                    No deleted products
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href?: string;
}) {
  const content = (
    <div className="rounded border p-4 bg-white/60 hover:bg-white transition flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-wide text-neutral-500 font-medium">
        {label}
      </span>
      <span className="text-2xl font-semibold">{value}</span>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}
