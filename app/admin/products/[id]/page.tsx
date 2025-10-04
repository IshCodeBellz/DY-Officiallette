import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/server/authOptions";
import { prisma } from "@/lib/server/prisma";
import { redirect } from "next/navigation";
import { EditProductClient } from "./EditProductClient";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminEditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  const uid = (session?.user as any)?.id as string | undefined;
  if (!uid) redirect(`/login?callbackUrl=/admin/products/${params.id}`);
  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user?.isAdmin) redirect("/");
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { images: { orderBy: { position: "asc" } }, sizeVariants: true },
  });
  if (!product) redirect("/admin/products");
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
              <p className="text-gray-600 mt-1">
                Update product information, images, and inventory
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/admin/products"
                className="text-sm rounded bg-neutral-200 text-neutral-900 px-3 py-2 hover:bg-neutral-300"
              >
                Back to Products
              </Link>
              <Link
                href="/admin"
                className="text-sm rounded bg-neutral-200 text-neutral-900 px-3 py-2 hover:bg-neutral-300"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Product Edit Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Product Details
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage product information and settings
            </p>
          </div>
          <div className="p-6">
            <EditProductClient product={product} />
          </div>
        </div>
      </div>
    </div>
  );
}
