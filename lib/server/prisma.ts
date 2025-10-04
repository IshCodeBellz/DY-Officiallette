import { PrismaClient } from "@prisma/client";

// Prevent multiple instances in dev (Next.js hot reload)
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma = global.__prisma || new PrismaClient();
// Track a simple disconnected flag for tests that call prisma.$disconnect()
if (typeof global !== "undefined") {
  if (!global.__prisma) {
    // attach a disconnected flag
    (global as any).__prismaDisconnected = false;
    const origDisconnect = prisma.$disconnect.bind(prisma) as any;
    prisma.$disconnect = async function (...args: any[]) {
      (global as any).__prismaDisconnected = true;
      return (origDisconnect as any)(...args);
    } as any;
    const origConnect = prisma.$connect.bind(prisma) as any;
    prisma.$connect = async function (...args: any[]) {
      const r = await (origConnect as any)(...args);
      (global as any).__prismaDisconnected = false;
      return r;
    } as any;
  }
}
if (process.env.NODE_ENV !== "production") global.__prisma = prisma;

export type { Prisma } from "@prisma/client";
