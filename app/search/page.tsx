import Link from "next/link";
import { formatPriceCents } from "@/lib/money";
import FiltersClient from "./_client/FiltersClient";
import SortClient from "./_client/SortClient";
import { headers } from "next/headers";

interface PageSearchParams {
  q?: string;
  category?: string;
  brand?: string;
  size?: string;
  min?: string;
  max?: string;
  sort?: string;
  debug?: string; // allow passing through debug to API
  page?: string;
}

export const dynamic = "force-dynamic";

async function getData(params: PageSearchParams) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) sp.set(k, v);
  });
  sp.set("facets", "1");
  sp.set("limit", "60");
  // Build absolute base (relative fetch caused URL parse error in Node runtime)
  let base = process.env.NEXT_PUBLIC_BASE_URL;
  if (!base) {
    const h = headers();
    const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
    const proto =
      h.get("x-forwarded-proto") ||
      (host.startsWith("localhost") ? "http" : "https");
    base = `${proto}://${host}`;
  }
  const url = `${base.replace(/\/$/, "")}/api/search?${sp.toString()}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return { items: [], facets: null, total: 0, totalCount: 0 };
    return res.json();
  } catch (e) {
    // Silent fallback; UI will show empty state
    return {
      items: [],
      facets: null,
      total: 0,
      error: (e as Error).message,
    } as any;
  }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const data = await getData(searchParams);
  const { q = "" } = searchParams;
  const sort = searchParams.sort || "newest";
  const page = parseInt(searchParams.page || "1", 10) || 1;
  const totalCount = data.totalCount || data.total;
  const pageSize = data.pageSize || 60;
  const totalPages = Math.max(1, Math.ceil((totalCount || 0) / pageSize));
  function pageHref(p: number) {
    const sp = new URLSearchParams();
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v && k !== "page") sp.set(k, v);
    });
    if (p > 1) sp.set("page", String(p));
    return `/search?${sp.toString()}`;
  }
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="w-full lg:w-64 lg:shrink-0 space-y-6">
          <div>
            <h1 className="text-xl font-bold mb-1">
              Results {q && `for "${q}"`}
            </h1>
            <p className="text-xs text-neutral-500">
              {data.total} item{data.total === 1 ? "" : "s"} found
            </p>
          </div>
          {data.facets && (
            <FiltersClient facets={data.facets} active={searchParams} />
          )}
        </aside>
        <main className="flex-1 space-y-4 min-w-0">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <SortClient current={sort} />
          </div>
          {data.items.length === 0 && (
            <div className="py-20 text-sm text-neutral-500 text-center border rounded">
              No results. Try adjusting filters.
            </div>
          )}
          {data.items.length > 0 && (
            <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
              {data.items.map((p: any) => (
                <li key={p.id} className="group">
                  <Link href={`/product/${p.id}`} className="block">
                    <div className="relative aspect-[3/4] bg-neutral-100 rounded overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.image}
                        alt={p.name}
                        loading="lazy"
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform"
                      />
                      {typeof p.score === "number" && sort === "trending" && (
                        <span className="absolute top-1 left-1 bg-black/60 text-[10px] px-1.5 py-0.5 rounded text-white">
                          {(p.score || 0).toFixed(1)}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-[12px] leading-tight line-clamp-2 font-medium min-h-[2.1em]">
                      {p.name}
                    </p>
                    <p className="text-[12px] font-semibold">
                      {formatPriceCents(p.priceCents)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {data.items.length > 0 && totalPages > 1 && (
            <nav
              className="flex items-center justify-center gap-2 pt-4 flex-wrap text-xs"
              aria-label="Pagination"
            >
              {page > 1 && (
                <Link
                  href={pageHref(page - 1)}
                  className="px-3 py-1 rounded border bg-white hover:bg-neutral-50"
                >
                  Prev
                </Link>
              )}
              {Array.from({ length: totalPages })
                .slice(0, 7)
                .map((_, idx) => {
                  const p = idx + 1;
                  if (p === page) {
                    return (
                      <span
                        key={p}
                        className="px-3 py-1 rounded border border-neutral-900 bg-neutral-900 text-white"
                      >
                        {p}
                      </span>
                    );
                  }
                  return (
                    <Link
                      key={p}
                      href={pageHref(p)}
                      className="px-3 py-1 rounded border bg-white hover:bg-neutral-50"
                    >
                      {p}
                    </Link>
                  );
                })}
              {page < totalPages && (
                <Link
                  href={pageHref(page + 1)}
                  className="px-3 py-1 rounded border bg-white hover:bg-neutral-50"
                >
                  Next
                </Link>
              )}
            </nav>
          )}
        </main>
      </div>
    </div>
  );
}
