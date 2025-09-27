import { prisma } from "@/lib/server/prisma";
import Link from "next/link";
import { Suspense } from "react";
import { formatPriceCents } from "@/lib/money";

interface SearchParams {
  q?: string;
  category?: string;
  size?: string;
  min?: string;
  max?: string;
  page?: string;
}

export const dynamic = "force-dynamic";

async function fetchProducts(params: SearchParams) {
  const page = Math.max(1, parseInt(params.page || "1"));
  const pageSize = 24;
  const min = params.min ? parseFloat(params.min) : 0;
  const max = params.max ? parseFloat(params.max) : 1000000;
  const where: any = {
    priceCents: { gte: Math.round(min * 100), lte: Math.round(max * 100) },
  };
  if (params.category) where.category = { slug: params.category };
  if (params.size) where.sizes = { some: { label: params.size } };
  if (params.q) {
    const q = params.q.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { brand: { name: { contains: q, mode: "insensitive" } } },
    ];
  }
  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { images: { orderBy: { position: "asc" }, take: 1 } },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return {
    total,
    page,
    pageSize,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: products.map((p: any) => ({
      id: p.id,
      name: p.name,
      priceCents: p.priceCents,
      image: p.images[0]?.url,
    })),
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const data = await fetchProducts(searchParams);
  const { q = "" } = searchParams;
  return (
    <div className="container mx-auto px-4 py-10 space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">
          Search Results {q && `for "${q}"`}
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {data.total} item{data.total === 1 ? "" : "s"} found
        </p>
      </header>
      <Suspense>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {data.items.map((p: any) => (
            <Link
              key={p.id}
              href={`/product/${p.id}`}
              className="group relative bg-neutral-100 aspect-[3/4] overflow-hidden rounded block"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.image}
                alt={p.name}
                className="object-cover w-full h-full group-hover:scale-105 transition-transform"
              />
              <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 to-transparent text-white text-xs">
                <div className="font-semibold truncate">{p.name}</div>
                <div>{formatPriceCents(p.priceCents)}</div>
              </div>
            </Link>
          ))}
        </div>
      </Suspense>
      {data.total > data.pageSize && (
        <Pagination
          total={data.total}
          page={data.page}
          pageSize={data.pageSize}
          params={searchParams}
        />
      )}
    </div>
  );
}

function Pagination({
  total,
  page,
  pageSize,
  params,
}: {
  total: number;
  page: number;
  pageSize: number;
  params: SearchParams;
}) {
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;
  const makeLink = (p: number) => {
    const sp = new URLSearchParams(params as any);
    sp.set("page", String(p));
    return `/search?${sp.toString()}`;
  };
  return (
    <nav
      className="flex flex-wrap gap-2 justify-center"
      aria-label="Pagination"
    >
      {Array.from({ length: pages }).map((_, i) => {
        const p = i + 1;
        const active = p === page;
        return (
          <Link
            key={p}
            href={makeLink(p)}
            className={`px-3 py-1 rounded border text-sm ${
              active
                ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                : "bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700"
            }`}
          >
            {p}
          </Link>
        );
      })}
    </nav>
  );
}
