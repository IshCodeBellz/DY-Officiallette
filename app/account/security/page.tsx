import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/server/authOptions";
import { prisma } from "@/lib/server/prisma";
import { redirect } from "next/navigation";
import SecurityClient from "./security.client";

export const dynamic = "force-dynamic";

export default async function AccountSecurityPage() {
  const session = await getServerSession(authOptions);
  const uid = (session?.user as any)?.id as string | undefined;
  if (!uid) redirect("/login?callbackUrl=/account/security");

  const user = await prisma.user.findUnique({
    where: { id: uid },
    select: {
      id: true,
      email: true,
      createdAt: true,
    },
  });

  if (!user) redirect("/login?callbackUrl=/account/security");

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">
          Security Settings
        </h1>
        <p className="text-neutral-600">
          Manage your account security and privacy settings.
        </p>
      </header>

      <SecurityClient
        user={{
          id: user.id,
          email: user.email,
          emailVerified: false, // Will be checked dynamically in client
          mfaEnabled: false, // Will be checked dynamically in client
          mfaBackupCodesCount: 0, // Will be checked dynamically in client
          memberSince: user.createdAt.toISOString(),
        }}
      />
    </div>
  );
}
