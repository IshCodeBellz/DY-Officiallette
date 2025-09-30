import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

export const runtime = "nodejs"; // ensure runs on Node (not edge) so Prisma works

// Unified health endpoint:
// - Performs a trivial DB read to verify connectivity
// - Returns 200 if DB reachable, 503 if not
// - Includes latency (ms) for basic insight
export async function GET() {
  const started = Date.now();
  let dbOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    dbOk = false;
  }
  const ms = Date.now() - started;
  const status = dbOk ? 200 : 503;
  return NextResponse.json(
    { ok: dbOk, db: dbOk ? "up" : "down", ms },
    { status, headers: { "cache-control": "no-store" } }
  );
}
