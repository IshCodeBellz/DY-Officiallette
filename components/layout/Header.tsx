"use client";
import Link from "next/link";
import { SearchBar } from "./SearchBar";
import EnhancedSearchBar from "../search/EnhancedSearchBar";
import { SiteNav } from "./SiteNav";
import { useCart, useWishlist } from "../providers/CartProvider";
import { useSession, signOut } from "next-auth/react";
import { DarkModeToggle } from "./DarkModeToggle";
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
      <header className="border-b border-neutral-200 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <Link
                href="/"
                className="font-black text-lg md:text-xl tracking-tight whitespace-nowrap"
              >
                DY<span className="text-brand-accent">OFFICIAL</span>
              </Link>
              <EnhancedSearchBar />
            </div>
            <nav className="hidden md:flex items-center gap-4 ml-auto">
              <DarkModeToggle />
              {session ? (
                <div className="flex items-center gap-2 text-sm max-w-xs">
                  <span
                    className="text-neutral-700 truncate max-w-[140px]"
                    title={
                      session.user?.name || session.user?.email || undefined
                    }
                  >
                    {session.user?.name || session.user?.email}
                  </span>
                  {(session.user as any)?.isAdmin && (
                    <Link href="/admin" className="hover:underline font-medium">
                      Admin
                    </Link>
                  )}
                  <Link href="/account" className="hover:underline">
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
                    className="hover:underline"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <Link href="/login" className="text-sm hover:underline">
                  Sign in
                </Link>
              )}
              <Link href="/saved" className="relative text-sm hover:underline">
                Saved
                <span
                  className={
                    "absolute -top-2 -right-3 bg-neutral-900 text-white rounded-full text-[10px] leading-none h-4 min-w-4 px-1 flex items-center justify-center transition-opacity " +
                    (wishItems.length === 0 ? "opacity-0" : "opacity-100")
                  }
                  aria-hidden={wishItems.length === 0}
                >
                  {wishItems.length}
                </span>
              </Link>
              <Link
                href="/social/wishlists"
                className="text-sm hover:underline"
              >
                Social
              </Link>
              <Link href="/bag" className="relative text-sm hover:underline">
                Bag
                <span
                  className={
                    "absolute -top-2 -right-3 bg-neutral-900 text-white rounded-full text-[10px] leading-none h-4 min-w-4 px-1 flex items-center justify-center transition-opacity " +
                    (totalQuantity === 0 ? "opacity-0" : "opacity-100")
                  }
                  aria-hidden={totalQuantity === 0}
                >
                  {totalQuantity}
                </span>
              </Link>
            </nav>
            <div className="flex md:hidden items-center gap-2">
              <DarkModeToggle />
              <Link
                href="/saved"
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 text-[11px]"
                aria-label="Saved items"
              >
                ♥
                <span
                  className={
                    "absolute -top-1 -right-1 bg-neutral-900 text-white rounded-full text-[10px] leading-none h-4 min-w-4 px-1 flex items-center justify-center " +
                    (wishItems.length === 0 ? "opacity-0" : "opacity-100")
                  }
                  aria-hidden={wishItems.length === 0}
                >
                  {wishItems.length}
                </span>
              </Link>
              <Link
                href="/bag"
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 text-[11px]"
                aria-label="Bag"
              >
                👜
                <span
                  className={
                    "absolute -top-1 -right-1 bg-neutral-900 text-white rounded-full text-[10px] leading-none h-4 min-w-4 px-1 flex items-center justify-center " +
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
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300"
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
          <SiteNav />
        </div>
      </header>
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div
            className="fixed inset-0 bg-black/55 backdrop-blur-sm z-[60]"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed top-0 right-0 h-full w-80 max-w-[92%] bg-white z-[61] shadow-xl flex flex-col will-change-transform animate-slide-in">
            <div className="flex items-center justify-between pl-4 pr-2 h-16 border-b">
              <span className="font-semibold text-sm">Menu</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
                className="rounded-full h-10 w-10 inline-flex items-center justify-center border border-neutral-300 hover:bg-neutral-50"
              >
                <span className="text-lg leading-none">×</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-5 text-sm space-y-6">
              {status === "loading" && (
                <div className="h-5 w-32 bg-neutral-200 animate-pulse rounded" />
              )}
              {status !== "loading" && session && (
                <div className="space-y-2">
                  <div className="font-medium truncate">
                    {session.user?.name || session.user?.email}
                  </div>
                  {(session.user as any)?.isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block hover:text-brand-accent"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <Link
                    href="/account"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block hover:text-brand-accent"
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
                    className="block hover:text-brand-accent text-left w-full"
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
                    className="block hover:text-brand-accent font-medium"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block hover:text-brand-accent"
                  >
                    Create account
                  </Link>
                </div>
              )}
              <div className="space-y-2 pt-2 border-t">
                <p className="text-[10px] font-semibold tracking-wide text-neutral-500 uppercase">
                  Categories
                </p>
                <div className="grid grid-cols-2 gap-1.5 text-[13px]">
                  {[
                    "womens-clothing",
                    "mens-clothing",
                    "denim",
                    "footwear",
                    "accessories",
                    "sportswear",
                    "dresses",
                    "outerwear",
                    "new-in",
                    "brands",
                  ].map((c) => (
                    <Link
                      key={c}
                      href={`/${c}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-2 py-1 rounded hover:bg-neutral-100 capitalize border border-transparent focus:outline-none focus:ring-2 focus:ring-neutral-300"
                    >
                      {c
                        .replace("womens-clothing", "Women")
                        .replace("mens-clothing", "Men")
                        .replace("footwear", "Shoes")
                        .replace("face-body", "Face + Body")
                        .replace("new-in", "New In")}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="space-y-2 pt-2 border-t">
                <Link
                  href="/saved"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between"
                >
                  <span>Saved Items</span>
                  <span className="text-xs bg-neutral-900 text-white rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center">
                    {wishItems.length}
                  </span>
                </Link>
                <Link
                  href="/social/wishlists"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block hover:text-brand-accent"
                >
                  Social Wishlists
                </Link>
                <Link
                  href="/bag"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between"
                >
                  <span>Bag</span>
                  <span className="text-xs bg-neutral-900 text-white rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center">
                    {totalQuantity}
                  </span>
                </Link>
              </div>
            </div>
            <div className="px-4 py-3 border-t text-[10px] text-neutral-500">
              © {new Date().getFullYear()} DYOFFICIAL
            </div>
          </div>
        </div>
      )}
    </>
  );
}
