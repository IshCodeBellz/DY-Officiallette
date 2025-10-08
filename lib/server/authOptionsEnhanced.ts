import { NextAuthOptions, User as NextAuthUser } from "next-auth";
// import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { compare } from "bcryptjs";
import { SecurityService } from "./security";
import { SecurityEventType } from "../security";

// Extend the User interface
interface ExtendedUser extends NextAuthUser {
  id: string;
  isAdmin: boolean;
  emailVerified: boolean;
}

/**
 * Enhanced NextAuth configuration with security features
 */
console.log("🚀 Enhanced Auth Configuration Loading...");
export const authOptionsEnhanced: NextAuthOptions = {
  // adapter: PrismaAdapter(prisma), // Commented out - install @next-auth/prisma-adapter if needed
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        mfaToken: { label: "MFA Token", type: "text", optional: true },
      },
      async authorize(credentials, req) {
        // Use multiple logging methods to ensure visibility
        console.log(
          "🔐 Enhanced Auth: authorize called with email:",
          credentials?.email
        );
        console.error(
          "🔐 Enhanced Auth: authorize called with email:",
          credentials?.email
        );
        process.stdout.write(
          "🔐 Enhanced Auth: authorize called with email: " +
            credentials?.email +
            "\n"
        );

        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Enhanced Auth: Missing credentials");
          console.error("❌ Enhanced Auth: Missing credentials");
          return null;
        }

        try {
          // Find user
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          console.log(
            "👤 Enhanced Auth: User found:",
            !!user,
            user
              ? `(attempts: ${
                  user.failedLoginAttempts
                }, locked: ${!!user.lockedAt})`
              : ""
          );

          if (!user) {
            // Log failed login attempt
            if (req) {
              await SecurityService.logSecurityEvent(
                SecurityEventType.SUSPICIOUS_LOGIN,
                SecurityService.extractSecurityContext(req as any)
              );
            }
            return null;
          }

          // Check if account is locked
          if (
            user.lockedAt &&
            user.lockedAt > new Date(Date.now() - 30 * 60 * 1000)
          ) {
            throw new Error(
              "Account temporarily locked due to security concerns"
            );
          }

          // Verify password
          const isValidPassword = await compare(
            credentials.password,
            user.passwordHash
          );

          if (!isValidPassword) {
            console.log(
              "❌ Enhanced Auth: Invalid password, incrementing failed attempts"
            );

            // Increment failed attempts
            const updatedUser = await prisma.user.update({
              where: { id: user.id },
              data: {
                failedLoginAttempts: { increment: 1 },
                // Lock account after 5 failed attempts
                lockedAt:
                  user.failedLoginAttempts >= 4 ? new Date() : user.lockedAt,
              },
            });

            console.log(
              "🚫 Enhanced Auth: Failed attempts now:",
              updatedUser.failedLoginAttempts,
              "Locked:",
              !!updatedUser.lockedAt
            );

            // Log failed login
            if (req) {
              await SecurityService.logSecurityEvent(
                SecurityEventType.SUSPICIOUS_LOGIN,
                SecurityService.extractSecurityContext(req as any, user.id)
              );
            }

            return null;
          }

          // Check MFA if enabled (placeholder for now due to Prisma sync issues)
          // if (user.mfaEnabled && !credentials.mfaToken) {
          //   throw new Error('MFA_REQUIRED');
          // }

          console.log(
            "✅ Enhanced Auth: Password valid, resetting failed attempts"
          );

          // Reset failed attempts on successful login
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: 0,
              lockedAt: null,
              lastLoginAt: new Date(),
            },
          });

          console.log(
            "🎉 Enhanced Auth: Login successful, updated lastLoginAt"
          );

          // Log successful login
          if (req) {
            await SecurityService.logSecurityEvent(
              SecurityEventType.MFA_VERIFICATION_SUCCESS,
              SecurityService.extractSecurityContext(req as any, user.id)
            );
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            isAdmin: user.isAdmin,
            emailVerified: user.emailVerified,
          };
        } catch (error) {
          console.error("Error:", error);
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 4 * 60 * 60, // Update every 4 hours
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        const extendedUser = user as ExtendedUser;
        token.id = extendedUser.id;
        token.isAdmin = extendedUser.isAdmin;
        token.emailVerified = Boolean(extendedUser.emailVerified);
        token.sessionStart = Date.now();
      }

      // Check for session timeout
      if (
        token.sessionStart &&
        Date.now() - (token.sessionStart as number) > 24 * 60 * 60 * 1000
      ) {
        // Session expired - return token but could add expiry logic
        console.log("Session timeout detected");
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.isAdmin = token.isAdmin as boolean;
        session.user.emailVerified = token.emailVerified as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      // Log successful sign-in event
      console.log(`User signed in: ${user.email}`);
    },
    async signOut({ session, token }) {
      // Log sign-out event
      if (session?.user?.email) {
        console.log(`User signed out: ${session.user.email}`);
      }
    },
  },
};
