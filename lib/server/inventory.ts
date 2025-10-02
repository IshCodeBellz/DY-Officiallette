import { PrismaClient } from "@prisma/client";

// Inventory utilities to centralize concurrency-safe stock mutations.
// For SQLite we keep the existing conditional UPDATE strategy.
// For Postgres we use a RETURNING clause (future ready; still safe in SQLite path).

export async function decrementSizeStock(
  tx: PrismaClient,
  sizeVariantId: string,
  qty: number
): Promise<boolean> {
  if (qty <= 0) return true; // nothing to decrement
  const dbUrl = process.env.DATABASE_URL || "";
  const isPostgres =
    dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://");
  if (isPostgres) {
    // Postgres dialect (RETURNING) — use $executeRawUnsafe, which returns number of rows affected.
    const affected = await (tx as any).$executeRawUnsafe(
      `UPDATE "SizeVariant" SET "stock" = "stock" - $1 WHERE "id" = $2 AND "stock" >= $1`,
      qty,
      sizeVariantId
    );
    return !!affected;
  }
  // SQLite path — use positional parameters.
  const affected = await (tx as any).$executeRawUnsafe(
    `UPDATE SizeVariant SET stock = stock - ? WHERE id = ? AND stock >= ?`,
    qty,
    sizeVariantId,
    qty
  );
  return !!affected;
}
