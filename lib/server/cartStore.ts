// TEMPORARY in-memory cart store (reset on server restart)
// For production replace with a database (Postgres, Redis, etc.)

import { CartItem } from "../types";

interface UserCartRecord {
  userId: string;
  items: CartItem[];
  updatedAt: number;
}

const carts = new Map<string, UserCartRecord>();

export function getUserCart(userId: string): CartItem[] {
  return carts.get(userId)?.items ?? [];
}

export function setUserCart(userId: string, items: CartItem[]) {
  carts.set(userId, { userId, items, updatedAt: Date.now() });
}

export function mergeUserCart(userId: string, incoming: CartItem[]) {
  const existing = getUserCart(userId);
  const map = new Map<string, CartItem>();
  [...existing, ...incoming].forEach((line) => {
    const prev = map.get(line.id);
    if (prev) {
      map.set(line.id, { ...prev, qty: Math.min(99, prev.qty + line.qty) });
    } else {
      map.set(line.id, line);
    }
  });
  const merged = Array.from(map.values());
  setUserCart(userId, merged);
  return merged;
}

export function clearUserCart(userId: string) {
  carts.delete(userId);
}

// Basic GC to prevent unbounded growth in dev
setInterval(() => {
  const cutoff = Date.now() - 1000 * 60 * 60 * 12; // 12h
  for (const [k, v] of carts.entries()) {
    if (v.updatedAt < cutoff) carts.delete(k);
  }
}, 1000 * 60 * 30).unref?.();
