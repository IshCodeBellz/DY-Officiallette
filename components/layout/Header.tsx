"use client";
import Link from "next/link";
import EnhancedSearchBar from "../search/EnhancedSearchBar";
import { useCart, useWishlist } from "../providers/CartProvider";
import { useSession, signOut } from "next-auth/react";
import { DarkModeToggle } from "./DarkModeToggle";
import { CurrencySelector } from "../ui/CurrencySelector";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function Header() {
  const { totalQuantity, clear: clearCart } = useCart();
  const { items: wishItems, clear: clearWishlist } = useWishlist();
  const { data: session, status } = useSession();
  const prevAuth = useRef<boolean>(!!session);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Clear local state when auth ends
  useEffect(() => {
    if (prevAuth.current && !session) {
      try {
        clearCart();
        clearWishlist();
        if (typeof window !== "undefined") {
          localStorage.removeItem("app.cart.v1");
          localStorage.removeItem("app.wishlist.v1");
        }
      } catch {}
    }
    prevAuth.current = !!session;
  }, [session, clearCart, clearWishlist]);

  // Close drawer after navigation
  useEffect(() => {
    if (mobileMenuOpen) setMobileMenuOpen(false);
  }, [pathname]);

  // Body scroll lock
  useEffect(() => {
    if (typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = mobileMenuOpen ? "hidden" : prev;
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 bg-blue-600 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Skip to main content
      </a>
      <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 sticky top-0 z-40">
        <div className="container mx-auto px-4">
          {/* Main Header Row */}
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo */}
            <div className="flex items-center">
              <Link
                href="/"
                className="font-bold text-xl tracking-tight"
                aria-label="DY Official Home"
              >
                <span className="text-neutral-900 dark:text-white">DY</span>
                <span className="text-red-600">OFFICIALETTE</span>
              </Link>
            </div>

            {/* Desktop Search Bar - Centered */}
            <div className="hidden md:block flex-1 max-w-2xl mx-8">
              <EnhancedSearchBar />
            </div>

            {/* Right Side - Currency, Auth, Actions */}
            <nav className="hidden md:flex items-center gap-4">
              <CurrencySelector variant="minimal" showLabel={false} size="sm" />
              <DarkModeToggle />
              {session ? (
                <div className="flex items-center gap-3 text-sm">
                  <span
                    className="text-neutral-700 dark:text-neutral-300 truncate max-w-[120px]"
                    title={
                      session.user?.name || session.user?.email || undefined
                    }
                  >
                    {session.user?.name?.split(" ")[0] || session.user?.email}
                  </span>
                  {(session.user as any)?.isAdmin && (
                    <Link
                      href="/admin"
                      className="hover:underline font-medium text-neutral-900 dark:text-white whitespace-nowrap"
                    >
                      Admin
                    </Link>
                  )}
                  <Link
                    href="/account"
                    className="hover:underline text-neutral-900 dark:text-white whitespace-nowrap"
                  >
                    My Account
                  </Link>
                  <button
                    onClick={() => {
                      try {
                        clearCart();
                        clearWishlist();
                        if (typeof window !== "undefined") {
                          localStorage.removeItem("app.cart.v1");
                          localStorage.removeItem("app.wishlist.v1");
                        }
                      } catch {}
                      signOut();
                    }}
                    className="hover:underline text-neutral-900 dark:text-white whitespace-nowrap"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="text-sm hover:underline text-neutral-900 dark:text-white"
                >
                  Sign in
                </Link>
              )}
              <Link
                href="/saved"
                className="relative text-sm hover:underline text-neutral-900 dark:text-white whitespace-nowrap"
              >
                Saved
                <span
                  className={
                    "absolute -top-2 -right-3 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-full text-[10px] leading-none h-4 min-w-4 px-1 flex items-center justify-center transition-opacity " +
                    (wishItems.length === 0 ? "opacity-0" : "opacity-100")
                  }
                  aria-hidden={wishItems.length === 0}
                >
                  {wishItems.length}
                </span>
              </Link>
              <Link
                href="/social/wishlists"
                className="text-sm hover:underline text-neutral-900 dark:text-white whitespace-nowrap"
              >
                Social
              </Link>
              <Link
                href="/bag"
                className="relative text-sm hover:underline text-neutral-900 dark:text-white whitespace-nowrap"
              >
                Bag
                <span
                  className={
                    "absolute -top-2 -right-3 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-full text-[10px] leading-none h-4 min-w-4 px-1 flex items-center justify-center transition-opacity " +
                    (totalQuantity === 0 ? "opacity-0" : "opacity-100")
                  }
                  aria-hidden={totalQuantity === 0}
                >
                  {totalQuantity}
                </span>
              </Link>
            </nav>

            {/* Mobile Controls */}
            <div className="flex md:hidden items-center gap-2">
              <DarkModeToggle />
              <Link
                href="/saved"
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 dark:border-neutral-600 text-[11px] text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
                aria-label="Saved items"
              >
                ♥
                <span
                  className={
                    "absolute -top-1 -right-1 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-full text-[10px] leading-none h-4 min-w-4 px-1 flex items-center justify-center " +
                    (wishItems.length === 0 ? "opacity-0" : "opacity-100")
                  }
                  aria-hidden={wishItems.length === 0}
                >
                  {wishItems.length}
                </span>
              </Link>
              <Link
                href="/bag"
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 dark:border-neutral-600 text-[11px] text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
                aria-label="Bag"
              >
                👜
                <span
                  className={
                    "absolute -top-1 -right-1 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-full text-[10px] leading-none h-4 min-w-4 px-1 flex items-center justify-center " +
                    (totalQuantity === 0 ? "opacity-0" : "opacity-100")
                  }
                  aria-hidden={totalQuantity === 0}
                >
                  {totalQuantity}
                </span>
              </Link>
              <button
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="md:hidden pb-3">
            <EnhancedSearchBar />
          </div>

          {/* Navigation Row - Desktop Only */}
          <div className="hidden md:block border-t border-neutral-200 dark:border-neutral-700">
            <nav className="flex items-center justify-center gap-8 py-3">
              <Link
                href="/new-in"
                className="text-sm font-medium text-neutral-900 dark:text-white hover:text-red-600 dark:hover:text-red-400"
              >
                New In
              </Link>
              <Link
                href="/womens"
                className="text-sm font-medium text-neutral-900 dark:text-white hover:text-red-600 dark:hover:text-red-400"
              >
                Women
              </Link>
              <Link
                href="/mens"
                className="text-sm font-medium text-neutral-900 dark:text-white hover:text-red-600 dark:hover:text-red-400"
              >
                Men
              </Link>
              <Link
                href="/shoes"
                className="text-sm font-medium text-neutral-900 dark:text-white hover:text-red-600 dark:hover:text-red-400"
              >
                Shoes
              </Link>
              <Link
                href="/accessories"
                className="text-sm font-medium text-neutral-900 dark:text-white hover:text-red-600 dark:hover:text-red-400"
              >
                Accessories
              </Link>
              <Link
                href="/brands"
                className="text-sm font-medium text-neutral-900 dark:text-white hover:text-red-600 dark:hover:text-red-400"
              >
                Brands
              </Link>
            </nav>
          </div>
        </div>
      </header>
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div
            className="fixed inset-0 bg-black/55 backdrop-blur-sm z-[60]"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed top-0 right-0 h-full w-80 max-w-[92%] bg-white dark:bg-neutral-900 z-[61] shadow-xl flex flex-col will-change-transform animate-slide-in">
            <div className="flex items-center justify-between pl-4 pr-2 h-16 border-b border-neutral-200 dark:border-neutral-700">
              <span className="font-semibold text-sm text-neutral-900 dark:text-white">
                Menu
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
                className="rounded-full h-10 w-10 inline-flex items-center justify-center border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-900 dark:text-white"
              >
                <span className="text-lg leading-none">×</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-5 text-sm space-y-6">
              {status === "loading" && (
                <div className="h-5 w-32 bg-neutral-200 dark:bg-neutral-700 animate-pulse rounded" />
              )}
              {status !== "loading" && session && (
                <div className="space-y-2">
                  <div className="font-medium truncate text-neutral-900 dark:text-white">
                    {session.user?.name || session.user?.email}
                  </div>
                  {(session.user as any)?.isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block hover:text-brand-accent text-neutral-700 dark:text-neutral-300"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <Link
                    href="/account"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block hover:text-brand-accent text-neutral-700 dark:text-neutral-300"
                  >
                    My Account
                  </Link>
                  <button
                    onClick={() => {
                      try {
                        clearCart();
                        clearWishlist();
                        if (typeof window !== "undefined") {
                          localStorage.removeItem("app.cart.v1");
                          localStorage.removeItem("app.wishlist.v1");
                        }
                      } catch {}
                      signOut();
                    }}
                    className="block hover:text-brand-accent text-left w-full text-neutral-700 dark:text-neutral-300"
                  >
                    Sign out
                  </button>
                </div>
              )}
              {status !== "loading" && !session && (
                <div className="space-y-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block hover:text-brand-accent font-medium text-neutral-900 dark:text-white"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block hover:text-brand-accent text-neutral-700 dark:text-neutral-300"
                  >
                    Create account
                  </Link>
                </div>
              )}
              <div className="space-y-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                <p className="text-[10px] font-semibold tracking-wide text-neutral-500 dark:text-neutral-400 uppercase">
                  Categories
                </p>
                {/* Primary Categories */}
                <div className="space-y-3">
                  {[
                    { href: "/new-in", label: "New In" },
                    { href: "/womens", label: "Women" },
                    { href: "/mens", label: "Men" },
                    { href: "/footwear", label: "Shoes" },
                    { href: "/accessories", label: "Accessories" },
                    { href: "/brands", label: "Brands" },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-base font-medium text-neutral-900 dark:text-white hover:text-brand-accent py-1"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>

                {/* Subcategories */}
                <div className="pt-3 border-t border-neutral-200 dark:border-neutral-700">
                  <p className="text-[10px] font-semibold tracking-wide text-neutral-500 dark:text-neutral-400 uppercase mb-2">
                    Popular Categories
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 text-[13px]">
                    {[
                      { href: "/women/dresses", label: "Women · Dresses" },
                      { href: "/women/outerwear", label: "Women · Outerwear" },
                      { href: "/men/outerwear", label: "Men · Outerwear" },
                      { href: "/men/denim", label: "Men · Denim" },
                    ].map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="px-2 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-transparent focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-600 text-neutral-700 dark:text-neutral-300"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                <Link
                  href="/saved"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between text-neutral-700 dark:text-neutral-300 hover:text-brand-accent"
                >
                  <span>Saved Items</span>
                  <span className="text-xs bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center">
                    {wishItems.length}
                  </span>
                </Link>
                <Link
                  href="/social/wishlists"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block hover:text-brand-accent text-neutral-700 dark:text-neutral-300"
                >
                  Social Wishlists
                </Link>
                <Link
                  href="/bag"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between text-neutral-700 dark:text-neutral-300 hover:text-brand-accent"
                >
                  <span>Bag</span>
                  <span className="text-xs bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center">
                    {totalQuantity}
                  </span>
                </Link>
              </div>
            </div>
            <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-700 text-[10px] text-neutral-500 dark:text-neutral-400">
              © {new Date().getFullYear()} DYOFFICIALLETTE
            </div>
          </div>
        </div>
      )}
    </>
  );
}
