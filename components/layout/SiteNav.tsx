import Link from "next/link";

const primary = [
  { href: "/women", label: "Women" },
  { href: "/men", label: "Men" },
  { href: "/sportswear", label: "Sportswear" },
  { href: "/new-in", label: "New In" },
  { href: "/brands", label: "Brands" },
  { href: "/clothing", label: "Clothing" },
  { href: "/shoes", label: "Shoes" },
  { href: "/accessories", label: "Accessories" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/outlet", label: "Outlet" },
];

export function SiteNav() {
  return (
    <div className="hidden md:block overflow-x-auto">
      <ul className="flex gap-6 text-xs font-semibold tracking-wide uppercase py-2">
        {primary.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="hover:text-brand-accent">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
