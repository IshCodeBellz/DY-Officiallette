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
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded border border-neutral-300 hover:bg-neutral-50"
        >
          ← Back
        </Link>
        <h1 className="text-2xl font-semibold">Edit Product</h1>
      </div>
      <EditProductClient product={product} />
    </div>
  );
}
