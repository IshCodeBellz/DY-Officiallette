import { type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Github from "next-auth/providers/github";
import { z } from "zod";
import { prisma } from "@/lib/server/prisma";
import { verifyPassword } from "@/lib/server/auth";

// Extended types for NextAuth
interface ExtendedUser {
  id: string;
  name?: string | null;
  email: string;
  isAdmin?: boolean;
  emailVerified?: boolean;
}

interface ExtendedToken {
  uid?: string;
  isAdmin?: boolean;
  emailVerified?: boolean;
}

interface ExtendedSession {
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    isAdmin?: boolean;
    emailVerified?: boolean;
  };
}

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
        // NextAuth User type is restrictive, using any for custom properties
        return {
          id: user.id,
          name: user.name || null,
          email: user.email,
          isAdmin: user.isAdmin,
          emailVerified: user.emailVerified,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      const extendedToken = token as ExtendedToken;
      const extendedUser = user as ExtendedUser;

      if (extendedUser?.id) {
        extendedToken.uid = extendedUser.id;
        extendedToken.isAdmin = extendedUser.isAdmin || false;
        extendedToken.emailVerified = extendedUser.emailVerified ?? true;
      } else if (extendedToken.uid && extendedToken.isAdmin === undefined) {
        // lazy load isAdmin if missing (e.g., from OAuth or legacy session)
        const dbUser = await prisma.user.findUnique({
          where: { id: extendedToken.uid },
        });
        if (dbUser) {
          extendedToken.isAdmin = dbUser.isAdmin;
          extendedToken.emailVerified = dbUser.emailVerified;
        }
      }
      return token;
    },
    async session({ session, token }) {
      const extendedSession = session as ExtendedSession;
      const extendedToken = token as ExtendedToken;

      if (extendedToken?.uid) extendedSession.user.id = extendedToken.uid;
      if (extendedToken?.isAdmin !== undefined)
        extendedSession.user.isAdmin = extendedToken.isAdmin;
      if (extendedToken?.emailVerified !== undefined)
        extendedSession.user.emailVerified = extendedToken.emailVerified;
      return session;
    },
  },
};
