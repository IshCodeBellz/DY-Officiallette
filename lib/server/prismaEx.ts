import { prisma } from "./prisma";

// Central helper to access newer models when TS language service lags.
// Replace with direct prisma.* once types fully synchronized.
export const prismaX = {
  ...prisma,
  orderEvent: (prisma as any).orderEvent,
  passwordResetToken: (prisma as any).passwordResetToken,
};

export type PrismaExtended = typeof prismaX;
