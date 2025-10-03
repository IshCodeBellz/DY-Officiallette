import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/server/authOptions";
import { prisma } from "@/lib/server/prisma";
import { redirect } from "next/navigation";
import { SecuritySettings } from "@/components/security/SecuritySettings";

export const dynamic = "force-dynamic";

interface SecurityData {
  user: {
    id: string;
    email: string;
    name: string | null;
    createdAt: Date;
    emailVerified: boolean; // Changed to match actual Prisma schema
    lastLogin: Date | null;
  };
  mfaStatus: {
    enabled: boolean;
    hasBackupCodes: boolean;
    trustedDevices: number;
  };
  recentActivity: {
    loginCount: number;
    lastLoginIp: string | null;
    lastLoginLocation: string | null;
  };
}

async function getSecurityData(userId: string): Promise<SecurityData> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      emailVerified: true,
      // Note: These fields might need to be added to your schema
      // lastLogin: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // TODO: Replace with actual MFA service calls
  const mfaStatus = {
    enabled: false, // await mfaService.isEnabled(userId)
    hasBackupCodes: false, // await mfaService.hasBackupCodes(userId)
    trustedDevices: 0, // await mfaService.getTrustedDeviceCount(userId)
  };

  // TODO: Replace with actual security service calls
  const recentActivity = {
    loginCount: 0, // await securityService.getRecentLoginCount(userId)
    lastLoginIp: null, // await securityService.getLastLoginIp(userId)
    lastLoginLocation: null, // await securityService.getLastLoginLocation(userId)
  };

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      emailVerified: user.emailVerified, // This should be Date | null from Prisma
      lastLogin: null, // This would come from actual tracking
    },
    mfaStatus,
    recentActivity,
  };
}

export default async function AccountSecurityPage() {
  const session = await getServerSession(authOptions);
  const uid = (session?.user as any)?.id as string | undefined;

  if (!uid) {
    redirect("/login?callbackUrl=/account/security");
  }

  let securityData: SecurityData;

  try {
    securityData = await getSecurityData(uid);
  } catch (error) {
    console.error("Failed to load security data:", error);
    redirect("/login?callbackUrl=/account/security");
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
                Account Security
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                Manage your security settings and monitor account activity
              </p>
            </div>
          </div>

          {/* Quick Security Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Account Status */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg border dark:border-neutral-700 p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">
                    Account Status
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    {securityData.user.emailVerified
                      ? "Verified"
                      : "Pending Verification"}
                  </p>
                </div>
              </div>
            </div>

            {/* MFA Status */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg border dark:border-neutral-700 p-4">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    securityData.mfaStatus.enabled
                      ? "bg-green-100 dark:bg-green-900/30"
                      : "bg-yellow-100 dark:bg-yellow-900/30"
                  }`}
                >
                  <svg
                    className={`w-5 h-5 ${
                      securityData.mfaStatus.enabled
                        ? "text-green-600 dark:text-green-400"
                        : "text-yellow-600 dark:text-yellow-400"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">
                    Two-Factor Auth
                  </p>
                  <p
                    className={`text-xs ${
                      securityData.mfaStatus.enabled
                        ? "text-green-600 dark:text-green-400"
                        : "text-yellow-600 dark:text-yellow-400"
                    }`}
                  >
                    {securityData.mfaStatus.enabled ? "Enabled" : "Not Enabled"}
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg border dark:border-neutral-700 p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">
                    Last Activity
                  </p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    {securityData.user.lastLogin
                      ? new Date(
                          securityData.user.lastLogin
                        ).toLocaleDateString()
                      : "No recent activity"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Security Recommendations */}
          {!securityData.mfaStatus.enabled && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-8">
              <div className="flex items-start space-x-3">
                <svg
                  className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <div>
                  <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                    Security Recommendation
                  </h3>
                  <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                    Enable two-factor authentication to significantly improve
                    your account security. This adds an extra layer of
                    protection even if your password is compromised.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Security Settings Component */}
        <SecuritySettings />

        {/* Account Information */}
        <div className="mt-12 bg-white dark:bg-neutral-800 rounded-lg border dark:border-neutral-700 p-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
            Account Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <dt className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Email Address
              </dt>
              <dd className="text-sm text-neutral-900 dark:text-white mt-1">
                {securityData.user.email}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Account Created
              </dt>
              <dd className="text-sm text-neutral-900 dark:text-white mt-1">
                {new Date(securityData.user.createdAt).toLocaleDateString(
                  "en-US",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Email Verification
              </dt>
              <dd className="text-sm mt-1">
                {securityData.user.emailVerified ? (
                  <span className="text-green-600 dark:text-green-400">
                    Verified
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400">
                    Not verified
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                Account ID
              </dt>
              <dd className="text-sm text-neutral-900 dark:text-white mt-1 font-mono">
                {securityData.user.id.slice(0, 8)}...
              </dd>
            </div>
          </div>
        </div>

        {/* Data Export */}
        <div className="mt-8 bg-white dark:bg-neutral-800 rounded-lg border dark:border-neutral-700 p-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
            Data & Privacy
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-white">
                  Download Your Data
                </p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  Request a copy of your personal data
                </p>
              </div>
              <button className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                Request Export
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-white">
                  Delete Account
                </p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  Permanently delete your account and all data
                </p>
              </div>
              <button className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-600 dark:border-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
