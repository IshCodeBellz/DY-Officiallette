"use client";

import Link from "next/link";

const navigationItems = [
  { href: "/new-in", label: "New In" },
  { href: "/womens", label: "Women" },
  { href: "/mens", label: "Men" },
  { href: "/shoes", label: "Shoes" },
  { href: "/accessories", label: "Accessories" },
  { href: "/brands", label: "Brands" },
];

export function SiteNav() {
  return (
    <div className="hidden md:block overflow-x-auto overflow-y-visible">
      <ul className="flex gap-6 text-xs font-semibold tracking-wide uppercase py-2 relative">
        {navigationItems.map((item) => (
          <li key={item.href} className="relative">
            <Link
              href={item.href}
              className="hover:text-brand-accent flex items-center gap-1"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
