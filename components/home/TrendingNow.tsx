import Image from "next/image";
import Link from "next/link";

export async function TrendingNow() {
  let items: any[] = [];
  try {
    const res = await fetch(`/api/trending`, { next: { revalidate: 120 } });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.items)) items = data.items;
    }
  } catch {}
  if (!items.length) return null;
  return (
    <section className="container mx-auto px-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold tracking-tight">
          {items[0]?.fallback ? "Latest Products" : "Trending Now"}
        </h2>
        <span className="text-[11px] uppercase tracking-wide text-neutral-500">
          {items[0]?.fallback ? "Fallback Feed" : "Live Activity"}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {items.map((p: any, i: number) => (
          <Link
            key={p.id}
            href={`/product/${p.id}`}
            className="group relative bg-neutral-100 aspect-[3/4] overflow-hidden rounded"
          >
            {!p.fallback && (
              <div className="absolute top-1 left-1 z-10 text-[11px] font-semibold bg-white/90 backdrop-blur px-1.5 py-0.5 rounded shadow">
                #{i + 1}
              </div>
            )}
            <Image
              src={p.image}
              alt={p.name}
              fill
              sizes="(max-width:768px) 50vw, (max-width:1200px) 20vw, 15vw"
              className="object-cover group-hover:scale-105 transition-transform"
            />
            <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 to-transparent text-white text-xs">
              <div className="font-semibold truncate">{p.name}</div>
              <div>£{(p.priceCents / 100).toFixed(2)}</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
