"use client";
import React from "react";
import Link from "next/link";

type Tile = {
  label: string;
  slug: string;
  highlight?: boolean; // for New In badge
};

interface CategoryTilesProps {
  tiles: Tile[];
  onTileClick?: (tile: Tile) => void;
  className?: string;
}

// Simple analytics dispatcher (can be replaced with real provider later)
function track(event: string, data: Record<string, any>) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("analytics", { detail: { event, ...data, ts: Date.now() } })
    );
    // Fallback console log for now
    // eslint-disable-next-line no-console
    console.debug("[analytics]", event, data);
  }
}

export const CategoryTiles: React.FC<CategoryTilesProps> = ({ tiles, onTileClick, className }) => {
  return (
    <div
      className={
        className ??
        "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6 lg:gap-8"
      }
    >
      {tiles.map((t) => (
        <Link
          key={t.slug}
          href={`/${t.slug}`}
          onClick={() => {
            track("category_tile_click", { slug: t.slug, label: t.label });
            onTileClick?.(t);
          }}
          className="group relative aspect-[4/5] rounded-lg overflow-hidden bg-neutral-100 flex items-center justify-center text-center shadow-sm hover:shadow-md transition"
        >
          <span className="text-lg md:text-xl font-semibold tracking-wide px-2">
            {t.label}
          </span>
          {t.highlight && (
            <span className="absolute top-2 right-2 bg-black text-white text-xs font-medium px-2 py-1 rounded">
              New
            </span>
          )}
          <span className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition" />
        </Link>
      ))}
    </div>
  );
};

export default CategoryTiles;