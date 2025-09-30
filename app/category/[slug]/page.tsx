import { prisma } from "@/lib/server/prisma";
import Image from "next/image";
import Link from "next/link";
import { formatPriceCents } from "@/lib/money";
import { notFound } from "next/navigation";

export default async function CategoryPage({
  params,
}: {
  params: { slug: string };
}) {
  const category = await prisma.category.findUnique({
    where: { slug: params.slug },
    include: {
      products: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        include: { images: { orderBy: { position: "asc" }, take: 1 } },
      },
    },
  });
  if (!category) return notFound();

  return (
    <div className="container mx-auto px-4 py-10 space-y-10">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: category.name,
            mainEntity: {
              '@type': 'ItemList',
              itemListElement: category.products.map((p, idx) => ({
                '@type': 'ListItem',
                position: idx + 1,
                url: `https://example.com/product/${p.id}`,
                name: p.name,
              })),
            },
          }),
        }}
      />
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{category.name}</h1>
          <p className="text-sm text-neutral-500 mt-1">
            {category.products.length} product
            {category.products.length !== 1 && "s"}
          </p>
        </div>
        <Link
          href="/"
          className="text-sm text-neutral-600 hover:text-neutral-900 underline"
        >
          Home
        </Link>
      </div>
      {category.products.length === 0 && (
        <p className="text-neutral-500">No products in this category yet.</p>
      )}
      <ul className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {category.products.map((p) => {
          const img = p.images[0];
          return (
            <li key={p.id} className="group">
              <Link
                href={`/product/${p.id}?from=${category.slug}`}
                className="block"
              >
                <div className="relative aspect-[3/4] bg-neutral-100 rounded overflow-hidden mb-2">
                  {img && (
                    <Image
                      src={img.url}
                      alt={img.alt || p.name}
                      fill
                      sizes="(max-width:768px) 50vw, 20vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                </div>
                <h3 className="text-sm font-medium line-clamp-2 min-h-[2.25rem]">
                  {p.name}
                </h3>
                <p className="text-sm font-semibold mt-1">
                  {formatPriceCents(p.priceCents)}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
