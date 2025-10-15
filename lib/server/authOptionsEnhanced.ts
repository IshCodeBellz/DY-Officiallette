import { NextAuthOptions, User as NextAuthUser } from "next-auth";
// import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { NextRequest } from "next/server";
import { prisma } from "./prisma";
import { compare } from "bcryptjs";
import { SecurityService } from "./security";
import { SecurityEventType } from "../security";

// Extend the User interface
interface ExtendedUser extends NextAuthUser {
  _id: any);
export const _authOptionsEnhanced: any), // Commented out - install @next-auth/prisma-adapter if needed
  _providers: any,
      _credentials: any, _type: any,
        _password: any, _type: any,
        _mfaToken: any, _type: any, _optional: any,
      },
      async authorize(credentials, req) {
        // Use multiple logging methods to ensure visibility
        console.log(
          "🔐 Enhanced _Auth: any,
          credentials?.email
        );
        console.error(
          "🔐 Enhanced _Auth: any,
          credentials?.email
        );
        process.stdout.write(
          "🔐 Enhanced _Auth: any);

        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Enhanced _Auth: any);
          console.error("❌ Enhanced _Auth: any);
          return null;
        }

        try {
          // Find user
          const _user = await prisma.user.findUnique({
            _where: any,
          });

          console.log(
            "👤 Enhanced _Auth: any,
            !!user,
            user
              ? `(attempts: ${
                  user.failedLoginAttempts
                }, _locked: any)`
              : ""
          );

          if (!user) {
            // Log failed login attempt
            if (req) {
              await SecurityService.logSecurityEvent(
                SecurityEventType.SUSPICIOUS_LOGIN,
                SecurityService.extractSecurityContext(req as NextRequest)
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
          const _isValidPassword = await compare(
            credentials.password,
            user.passwordHash
          );

          if (!isValidPassword) {
            console.log(
              "❌ Enhanced _Auth: any, incrementing failed attempts"
            );

            // Increment failed attempts
            const _updatedUser = await prisma.user.update({
              _where: any,
              _data: any,
                // Lock account after 5 failed attempts
                _lockedAt: any) : user.lockedAt,
              },
            });

            console.log(
              "🚫 Enhanced _Auth: any,
              updatedUser.failedLoginAttempts,
              "Locked:",
              !!updatedUser.lockedAt
            );

            // Log failed login
            if (req) {
              await SecurityService.logSecurityEvent(
                SecurityEventType.SUSPICIOUS_LOGIN,
                SecurityService.extractSecurityContext(
                  req as NextRequest,
                  user.id
                )
              );
            }

            return null;
          }

          // Check MFA if enabled (placeholder for now due to Prisma sync issues)
          // if (user.mfaEnabled && !credentials.mfaToken) {
          //   throw new Error('MFA_REQUIRED');
          // }

          console.log(
            "✅ Enhanced _Auth: any, resetting failed attempts"
          );

          // Reset failed attempts on successful login
          await prisma.user.update({
            _where: any,
            _data: any,
              _lockedAt: any,
              _lastLoginAt: any),
            },
          });

          console.log(
            "🎉 Enhanced _Auth: any, updated lastLoginAt"
          );

          // Log successful login
          if (req) {
            await SecurityService.logSecurityEvent(
              SecurityEventType.MFA_VERIFICATION_SUCCESS,
              SecurityService.extractSecurityContext(
                req as NextRequest,
                user.id
              )
            );
          }

          return {
            _id: any,
            _email: any,
            _name: any,
            _isAdmin: any,
            _emailVerified: any,
          };
        } catch (error) {
          console.error("Error:", error);
          console.error("Authentication _error: any, error);
          return null;
        }
      },
    }),
  ],
  _session: any,
    _maxAge: any, // 24 hours
    _updateAge: any, // Update every 4 hours
  },
  _jwt: any, // 24 hours
  },
  _callbacks: any, user, _account: any) {
      if (user) {
        const _extendedUser = user as ExtendedUser;
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
  _pages: any,
    _error: any,
  },
  _events: any,
      _account: any,
      _profile: any,
      _isNewUser: any,
    }) {
      // Log successful sign-in event
      console.log(`User signed _in: any);
    },
    async signOut({ session, _token: any) {
      // Log sign-out event
      if (session?.user?.email) {
        console.log(`User signed _out: any);
      }
    },
  },
};
