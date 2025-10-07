import { type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Github from "next-auth/providers/github";
import { z } from "zod";
import { prisma } from "@/lib/server/prisma";
import { verifyPassword } from "@/lib/server/auth";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(3),
});

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;
        if (!user.emailVerified) {
          // Reject login until email verified
          return null;
        }
        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) return null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return {
          id: user.id,
          name: user.name || null,
          email: user.email,
          isAdmin: user.isAdmin,
        } as any;
      },
    }),
    ...(process.env.GITHUB_ID && process.env.GITHUB_SECRET
      ? [
          Github({
            clientId: process.env.GITHUB_ID,
            clientSecret: process.env.GITHUB_SECRET,
          }),
        ]
      : []),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        (token as any).uid = (user as any).id;
        (token as any).isAdmin = (user as any).isAdmin || false;
        (token as any).emailVerified = (user as any).emailVerified ?? true;
      } else if ((token as any).uid && (token as any).isAdmin === undefined) {
        // lazy load isAdmin if missing (e.g., from OAuth or legacy session)
        const dbUser = await prisma.user.findUnique({
          where: { id: (token as any).uid },
        });
        if (dbUser) {
          (token as any).isAdmin = dbUser.isAdmin;
          (token as any).emailVerified = dbUser.emailVerified;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if ((token as any)?.uid) (session.user as any).id = (token as any).uid;
      if ((token as any)?.isAdmin !== undefined)
        (session.user as any).isAdmin = (token as any).isAdmin;
      if ((token as any)?.emailVerified !== undefined)
        (session.user as any).emailVerified = (token as any).emailVerified;
      return session;
    },
  },
};
