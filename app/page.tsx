import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-12 pb-20">
      <section className="relative h-[480px] w-full bg-neutral-200 flex items-center justify-center">
        <div className="absolute inset-0 grid md:grid-cols-2">
          <div className="hidden md:block relative">
            <Image
              src="https://picsum.photos/900/1200"
              alt="Hero"
              fill
              className="object-cover"
            />
          </div>
          <div className="relative">
            <Image
              src="https://picsum.photos/901/1200"
              alt="Hero"
              fill
              className="object-cover"
            />
          </div>
        </div>
        <div className="relative z-10 text-center bg-white/80 backdrop-blur rounded p-8 mx-4 max-w-xl">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">
            Discover Fashion Online
          </h1>
          <p className="mt-4 text-sm md:text-base text-neutral-700">
            Shop the latest trends in clothing, shoes, accessories and more from
            over 850 brands.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link href="/women" className="btn-primary">
              Shop Women
            </Link>
            <Link href="/men" className="btn-outline">
              Shop Men
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6">Trending Now</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="group relative bg-neutral-100 aspect-[3/4] overflow-hidden rounded"
            >
              <Image
                src={`https://picsum.photos/seed/trend-${i}/500/700`}
                alt="Trending item"
                fill
                className="object-cover group-hover:scale-105 transition-transform"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6">Shop By Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {[
            { label: "Clothing", slug: "clothing" },
            { label: "Shoes", slug: "shoes" },
            { label: "Accessories", slug: "accessories" },
            { label: "Sportswear", slug: "sportswear" },
            { label: "Face + Body", slug: "face-body" },
            { label: "Brands", slug: "brands" },
            { label: "New In", slug: "new-in" },
          ].map((cat) => (
            <Link
              key={cat.label}
              href={`/${cat.slug}`}
              className="relative aspect-square bg-neutral-100 rounded flex items-center justify-center text-center text-sm font-semibold hover:bg-neutral-200 transition"
            >
              {cat.label}
              {cat.slug === "new-in" && (
                <span
                  className="absolute top-2 right-2 bg-rose-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold tracking-wide shadow"
                  aria-label="New arrivals"
                >
                  NEW
                </span>
              )}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
