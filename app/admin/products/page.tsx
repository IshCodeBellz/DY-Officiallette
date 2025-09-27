import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/server/authOptions";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/server/prisma";
// Search is now rendered inside client Filters component
import FiltersClient from "./FiltersClient";
import { Suspense } from "react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const session = await getServerSession(authOptions);
  const uid = (session?.user as any)?.id as string | undefined;
  if (!uid) redirect("/login?callbackUrl=/admin/products");
  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user?.isAdmin) redirect("/");

  const brand =
    typeof searchParams?.brand === "string" ? searchParams?.brand : undefined;
  const category =
    typeof searchParams?.category === "string"
      ? searchParams?.category
      : undefined;
  const includeDeleted = searchParams?.deleted === "1";
  const where: any = {
    ...(includeDeleted ? {} : { deletedAt: null }),
    ...(brand ? { brandId: brand } : {}),
    ...(category ? { categoryId: category } : {}),
  };
  const products = await prisma.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 150,
    select: {
      id: true,
      sku: true,
      name: true,
      priceCents: true,
      createdAt: true,
      deletedAt: true,
      brand: { select: { name: true, id: true } },
      category: { select: { name: true, id: true } },
    },
  });
  const brands = await prisma.brand.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold">
            Products ({products.length})
          </h1>
          <Link
            href="/admin/products/new"
            className="text-sm rounded bg-neutral-900 text-white px-3 py-2 hover:bg-neutral-800"
          >
            New Product
          </Link>
        </div>
        <FiltersClient
          brands={brands}
          categories={categories}
          initialBrand={brand}
          initialCategory={category}
          initialIncludeDeleted={includeDeleted}
        />
      </div>
      <div className="overflow-x-auto border rounded">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left">
            <tr>
              <th className="py-2 px-3 font-medium">Name</th>
              <th className="py-2 px-3 font-medium">SKU</th>
              <th className="py-2 px-3 font-medium">Brand</th>
              <th className="py-2 px-3 font-medium">Category</th>
              <th className="py-2 px-3 font-medium">Price</th>
              <th className="py-2 px-3 font-medium">Created</th>
              <th className="py-2 px-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {products.map((p: any) => (
              <tr
                key={p.id}
                className={`border-t last:border-b hover:bg-neutral-50/70 ${
                  p.deletedAt ? "opacity-60" : ""
                }`}
              >
                <td className="py-2 px-3">
                  {p.name}{" "}
                  {p.deletedAt && (
                    <span className="ml-1 inline-block text-[10px] px-1 py-0.5 rounded bg-yellow-100 text-yellow-700 border border-yellow-300">
                      Deleted
                    </span>
                  )}
                </td>
                <td className="py-2 px-3 font-mono text-xs">{p.sku}</td>
                <td className="py-2 px-3 text-xs">{p.brand?.name || "-"}</td>
                <td className="py-2 px-3 text-xs">{p.category?.name || "-"}</td>
                <td className="py-2 px-3">
                  ${(p.priceCents / 100).toFixed(2)}
                </td>
                <td className="py-2 px-3 text-xs text-neutral-500">
                  {p.createdAt.toISOString().split("T")[0]}
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
