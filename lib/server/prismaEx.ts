import { prisma } from "./prisma";

// Central helper to access newer models when TS language service lags.
// Replace with direct prisma.* once types fully synchronized.
// Using unknown here is necessary for newer Prisma models not yet in generated types
export const prismaX = {
  ...prisma,
  orderEvent: (prisma as unknown as { orderEvent: unknown }).orderEvent,
  passwordResetToken: (prisma as unknown as { passwordResetToken: unknown })
    .passwordResetToken,
};

export type PrismaExtended = typeof prismaX;
