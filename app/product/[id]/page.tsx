import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/server/prisma";
import { Suspense } from "react";
import ProductClient from "./ProductClient";
import { formatPriceCents } from "@/lib/money";

export default async function ProductPage({
  params,
}: {
  params: { id: string };
}) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { images: { orderBy: { position: "asc" } }, sizes: true },
  });
  if (!product) return notFound();
  return (
    <div className="container mx-auto px-4 py-10 grid gap-12 md:grid-cols-2">
      <div className="grid gap-4">
        {product.images.map((im: any) => (
          <div
            key={im.id}
            className="relative aspect-[3/4] bg-neutral-100 overflow-hidden rounded"
          >
            <Image
              src={im.url}
              alt={im.alt || product.name}
              fill
              className="object-cover"
            />
          </div>
        ))}
      </div>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
          <p className="mt-2 text-2xl font-semibold">
            {formatPriceCents(product.priceCents)}
          </p>
        </div>
        <p className="text-sm leading-relaxed text-neutral-700 max-w-prose">
          {product.description}
        </p>
        <Suspense>
          <ProductClient
            product={{
              id: product.id,
              name: product.name,
              priceCents: product.priceCents,
              image: product.images[0]?.url || "",
              description: product.description,
              sizes: product.sizes.map((s: any) => s.label),
              images: product.images.map((i: any) => i.url),
            }}
          />
        </Suspense>
        <div className="text-xs text-neutral-500 space-y-2">
          <p>Free delivery and returns (Ts&Cs apply).</p>
          <p>100 day returns.</p>
        </div>
      </div>
    </div>
  );
}
