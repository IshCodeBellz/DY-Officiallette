"use client";
import Link from "next/link";
import Image from "next/image";
import { SearchBar } from "./SearchBar";
import { SiteNav } from "./SiteNav";
import { useCart, useWishlist } from "../providers/CartProvider";
import { useSession, signIn, signOut } from "next-auth/react";
import { DarkModeToggle } from "./DarkModeToggle";

export function Header() {
  const { totalQuantity } = useCart();
  const { items: wishItems } = useWishlist();
  const { data: session, status } = useSession();
  return (
    <header className="border-b border-neutral-200 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center gap-6">
          <Link href="/" className="font-black text-xl tracking-tight">
            ASOS<span className="text-brand-accent">CLONE</span>
          </Link>
          <SearchBar className="hidden md:flex flex-1" />
          <nav className="flex items-center gap-4 ml-auto">
            <DarkModeToggle />
            {session ? (
              <div className="flex items-center gap-2 text-sm">
                <span
                  className="text-neutral-700 truncate max-w-[120px]"
                  title={session.user?.name || session.user?.email || undefined}
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
                <button onClick={() => signOut()} className="hover:underline">
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
              {wishItems.length > 0 && (
                <span className="absolute -top-2 -right-3 bg-neutral-900 text-white rounded-full text-[10px] leading-none h-4 min-w-4 px-1 flex items-center justify-center">
                  {wishItems.length}
                </span>
              )}
            </Link>
            <Link href="/bag" className="relative text-sm hover:underline">
              Bag
              {totalQuantity > 0 && (
                <span className="absolute -top-2 -right-3 bg-neutral-900 text-white rounded-full text-[10px] leading-none h-4 min-w-4 px-1 flex items-center justify-center">
                  {totalQuantity}
                </span>
              )}
            </Link>
          </nav>
        </div>
        <SiteNav />
      </div>
    </header>
  );
}
