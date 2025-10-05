"use client";

import Link from "next/link";
import { useState } from "react";

const navigationItems = [
  { href: "/new-in", label: "New In" },
  {
    href: "/womens-clothing",
    label: "Women",
    subcategories: [
      { href: "/dresses", label: "Dresses" },
      { href: "/outerwear", label: "Outerwear" },
      { href: "/sportswear", label: "Sportswear" },
      { href: "/denim", label: "Denim" },
      { href: "/womens-clothing", label: "View All Women's" },
    ],
  },
  {
    href: "/mens-clothing",
    label: "Men",
    subcategories: [
      { href: "/outerwear", label: "Outerwear" },
      { href: "/sportswear", label: "Sportswear" },
      { href: "/denim", label: "Denim" },
      { href: "/mens-clothing", label: "View All Men's" },
    ],
  },
  { href: "/footwear", label: "Shoes" },
  { href: "/accessories", label: "Accessories" },
  { href: "/brands", label: "Brands" },
];

export function SiteNav() {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (
    item: (typeof navigationItems)[0],
    event: React.MouseEvent
  ) => {
    // Clear any existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }

    if (item.subcategories) {
      const rect = event.currentTarget.getBoundingClientRect();
      setDropdownPosition({
        left: rect.left,
        top: rect.bottom + window.scrollY,
      });
      setActiveDropdown(item.label);
    }
  };

  const handleMouseLeave = () => {
    // Set a timeout to close the dropdown after a brief delay
    const id = setTimeout(() => {
      setActiveDropdown(null);
      setDropdownPosition(null);
    }, 200);
    setTimeoutId(id);
  };

  const handleDropdownEnter = () => {
    // Clear the timeout when mouse enters dropdown
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
  };

  const handleDropdownLeave = () => {
    // Immediately close when leaving dropdown
    setActiveDropdown(null);
    setDropdownPosition(null);
  };

  return (
    <>
      <div className="hidden md:block overflow-x-auto overflow-y-visible">
        <ul className="flex gap-6 text-xs font-semibold tracking-wide uppercase py-2 relative">
          {navigationItems.map((item) => (
            <li
              key={item.href}
              className="relative"
              onMouseEnter={(e) => handleMouseEnter(item, e)}
              onMouseLeave={handleMouseLeave}
            >
              <Link
                href={item.href}
                className="hover:text-brand-accent flex items-center gap-1"
              >
                {item.label}
                {item.subcategories && (
                  <svg
                    className="w-3 h-3 transition-transform duration-200"
                    style={{
                      transform:
                        activeDropdown === item.label
                          ? "rotate(180deg)"
                          : "rotate(0deg)",
                    }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Dropdown Menu - Rendered outside the nav container */}
      {activeDropdown && dropdownPosition && (
        <div
          className="fixed bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-md shadow-xl min-w-48 z-[9999] will-change-transform"
          style={{
            left: dropdownPosition.left,
            top: dropdownPosition.top + 8,
          }}
          onMouseEnter={handleDropdownEnter}
          onMouseLeave={handleDropdownLeave}
        >
          <ul className="py-2">
            {navigationItems
              .find((item) => item.label === activeDropdown)
              ?.subcategories?.map((subItem) => (
                <li key={subItem.href}>
                  <Link
                    href={subItem.href}
                    className="block px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-brand-accent transition-colors normal-case"
                    onClick={() => {
                      // Close dropdown when link is clicked
                      setActiveDropdown(null);
                      setDropdownPosition(null);
                      if (timeoutId) {
                        clearTimeout(timeoutId);
                        setTimeoutId(null);
                      }
                    }}
                  >
                    {subItem.label}
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      )}
    </>
  );
}
