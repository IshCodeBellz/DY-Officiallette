import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

// Basic trending scoring with time decay
const HALF_LIFE_HOURS = 72; // tune as needed

export async function GET() {
  // Raw SQL for scoring (SQLite flavor)
  const items: any[] = await prisma.$queryRawUnsafe(`
    SELECT
      p.id,
      p.name,
      p.priceCents,
      (SELECT url FROM ProductImage WHERE productId = p.id ORDER BY position ASC LIMIT 1) as image,
      p.createdAt,
      COALESCE(m.views,0) as views,
      COALESCE(m.detailViews,0) as detailViews,
      COALESCE(m.wishlists,0) as wishlists,
      COALESCE(m.addToCart,0) as addToCart,
      COALESCE(m.purchases,0) as purchases,
      (
        (0.5 * COALESCE(m.views,0)) +
        (1.0 * COALESCE(m.detailViews,0)) +
        (1.3 * COALESCE(m.wishlists,0)) +
        (2.2 * COALESCE(m.addToCart,0)) +
        (4.0 * COALESCE(m.purchases,0))
      ) *
      (1.0 / (1.0 + ((strftime('%s','now') - strftime('%s', p.createdAt)) / (3600.0 * ${HALF_LIFE_HOURS}))))
      AS score
    FROM Product p
    LEFT JOIN ProductMetrics m ON m.productId = p.id
    ORDER BY score DESC
    LIMIT 12;
  `);

  return NextResponse.json({ items });
}

export const runtime = 'nodejs';