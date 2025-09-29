"use client";
import { cn } from "../../lib/utils";
import { Search, Loader2 } from "lucide-react";
import { HTMLAttributes, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Suggestion {
  id: string;
  name: string;
  price: number;
  image: string;
}

interface Props extends HTMLAttributes<HTMLDivElement> {}

export function SearchBar({ className }: Props) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<any>();
  const router = useRouter();

  useEffect(() => {
    if (!q.trim()) {
      setItems([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      if (abortRef.current) abortRef.current.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      fetch(`/api/search?q=${encodeURIComponent(q)}&limit=8`, {
        signal: ac.signal,
      })
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((data) => {
          setItems(data.items?.slice(0, 8) || []);
          setOpen(true);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 250);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [q]);

  function submitSearch(term: string) {
    const value = term.trim();
    if (!value) return;
    setOpen(false);
    setActiveIndex(-1);
    router.push(`/search?q=${encodeURIComponent(value)}`);
  }

  return (
    <div className={cn("relative w-full max-w-md", className)}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitSearch(q);
        }}
        role="search"
        aria-label="Site search"
      >
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setActiveIndex(-1);
          }}
          onFocus={() => {
            if (items.length) setOpen(true);
          }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (!open) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveIndex((i) => Math.min(items.length - 1, i + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIndex((i) => Math.max(-1, i - 1));
            } else if (e.key === "Enter") {
              if (activeIndex >= 0 && activeIndex < items.length) {
                e.preventDefault();
                const it = items[activeIndex];
                router.push(`/product/${it.id}`);
                setOpen(false);
                return;
              }
              // fall through to form submit (already handled)
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          type="search"
          placeholder="Search for items and brands"
          className="w-full rounded-full border border-neutral-300 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 bg-neutral-100 px-4 py-2 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-500"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="search-suggestions"
        />
        {/* Submit button visually hidden but accessible to screen readers */}
        <button type="submit" className="sr-only">
          Search
        </button>
      </form>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Search className="h-5 w-5" />
        )}
      </div>
      {open && items.length > 0 && (
        <ul
          id="search-suggestions"
          role="listbox"
          className="absolute z-50 mt-2 w-full overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-lg text-sm divide-y divide-neutral-100 dark:divide-neutral-800"
        >
          {items.map((it, idx) => (
            <li key={it.id} role="option" aria-selected={idx === activeIndex}>
              <Link
                href={`/product/${it.id}`}
                className={cn(
                  "flex items-center gap-3 p-2 hover:bg-neutral-50 dark:hover:bg-neutral-800",
                  idx === activeIndex && "bg-neutral-100 dark:bg-neutral-800"
                )}
                onMouseEnter={() => setActiveIndex(idx)}
                onMouseLeave={() => setActiveIndex(-1)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={it.image}
                  alt=""
                  className="h-10 w-8 object-cover rounded"
                />
                <span className="flex-1 truncate">{it.name}</span>
                <span className="font-medium">${it.price.toFixed(2)}</span>
              </Link>
            </li>
          ))}
          <li>
            <Link
              href={`/search?q=${encodeURIComponent(q)}`}
              className="block px-3 py-2 text-center text-xs uppercase tracking-wide font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
              onClick={() => submitSearch(q)}
            >
              View all results
            </Link>
          </li>
        </ul>
      )}
    </div>
  );
}
