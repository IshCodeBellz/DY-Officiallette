import { PrismaClient } from "@prisma/client";

// Prevent multiple instances in dev (Next.js hot reload)
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma = global.__prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") global.__prisma = prisma;

export type { Prisma } from "@prisma/client";
