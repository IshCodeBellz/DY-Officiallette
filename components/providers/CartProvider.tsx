"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  CartContextValue,
  CartItem,
  ProductSummary,
  WishlistContextValue,
  WishlistItem,
} from "@/lib/types";
import { lineIdFor } from "@/lib/types";

// Keys for localStorage
const CART_KEY = "app.cart.v1";
const WISHLIST_KEY = "app.wishlist.v1";

// ---------- Cart ----------
const CartContext = createContext<CartContextValue | null>(null);

function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveJSON<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

// ---------- Wishlist ----------
const WishlistContext = createContext<WishlistContextValue | null>(null);

export function CommerceProviders({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <WishlistProvider>{children}</WishlistProvider>
    </CartProvider>
  );
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  // Start with empty array on both server AND initial client render to keep
  // markup identical and avoid hydration mismatch. We load from localStorage
  // only after mount.
  const [items, setItems] = useState<CartItem[]>([]);
  const mounted = useRef(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = loadJSON<CartItem[]>(CART_KEY, []);
    if (stored.length) setItems(stored);
    mounted.current = true;
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (mounted.current) saveJSON(CART_KEY, items);
  }, [items]);

  const addItem = useCallback((item: ProductSummary, qty: number = 1) => {
    setItems((prev) => {
      const lineId = lineIdFor(item.productId, item.size);
      const existing = prev.find((i) => i.id === lineId);
      if (existing) {
        return prev.map((i) =>
          i.id === lineId ? { ...i, qty: Math.min(99, i.qty + qty) } : i
        );
      }
      const newLine: CartItem = { id: lineId, qty: Math.min(99, qty), ...item };
      return [...prev, newLine];
    });
  }, []);

  const updateQty = useCallback((lineId: string, qty: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === lineId ? { ...i, qty: Math.min(99, Math.max(1, qty)) } : i
      )
    );
  }, []);

  const removeItem = useCallback((lineId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== lineId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const subtotalCents = useMemo(
    () => items.reduce((sum, i) => sum + i.priceCents * i.qty, 0),
    [items]
  );
  const totalQuantity = useMemo(
    () => items.reduce((sum, i) => sum + i.qty, 0),
    [items]
  );

  const value: CartContextValue = {
    items,
    addItem,
    updateQty,
    removeItem,
    clear,
    subtotal: subtotalCents / 100,
    totalQuantity,
    hydrated,
  };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const mounted = useRef(false);
  useEffect(() => {
    const stored = loadJSON<WishlistItem[]>(WISHLIST_KEY, []);
    if (stored.length) setItems(stored);
    mounted.current = true;
  }, []);
  useEffect(() => {
    if (mounted.current) saveJSON(WISHLIST_KEY, items);
  }, [items]);

  const add = useCallback((item: ProductSummary) => {
    const id = lineIdFor(item.productId, item.size);
    setItems((prev) =>
      prev.some((i) => i.id === id) ? prev : [...prev, { id, ...item }]
    );
  }, []);
  const remove = useCallback(
    (id: string) => setItems((prev) => prev.filter((i) => i.id !== id)),
    []
  );
  const toggle = useCallback((item: ProductSummary) => {
    const id = lineIdFor(item.productId, item.size);
    setItems((prev) =>
      prev.some((i) => i.id === id)
        ? prev.filter((i) => i.id !== id)
        : [...prev, { id, ...item }]
    );
  }, []);
  const has = useCallback(
    (id: string) => items.some((i) => i.id === id),
    [items]
  );
  const moveToCart = useCallback(
    (id: string, addToCart: (item: ProductSummary, qty?: number) => void) => {
      const line = items.find((i) => i.id === id);
      if (!line) return;
      addToCart(line, 1);
      setItems((prev) => prev.filter((i) => i.id !== id));
    },
    [items]
  );
  const clear = useCallback(() => setItems([]), []);

  const value: WishlistContextValue = {
    items,
    add,
    remove,
    toggle,
    moveToCart,
    has,
    clear,
  };
  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
