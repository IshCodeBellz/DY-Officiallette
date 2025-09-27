import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/server/authOptions";
import { prisma } from "@/lib/server/prisma";
import { redirect } from "next/navigation";
import AccountSettingsClient from "./settingsClient";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  const uid = (session?.user as any)?.id as string | undefined;
  if (!uid) redirect("/login?callbackUrl=/account");
  const user = await prisma.user.findUnique({
    where: { id: uid },
    select: {
      id: true,
      email: true,
      name: true,
      isAdmin: true,
      createdAt: true,
    },
  });
  if (!user) redirect("/login?callbackUrl=/account");

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-10">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">My Account</h1>
        <p className="text-sm text-neutral-500">
          Manage your profile and view activity.
        </p>
      </header>
      <section className="space-y-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-600">
          Profile
        </h2>
        <AccountSettingsClient
          initialName={user.name || ""}
          email={user.email}
        />
      </section>
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-600">
          Quick Links
        </h2>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link className="underline" href="/saved">
            Wishlist
          </Link>
          <Link className="underline" href="/bag">
            Bag
          </Link>
          <Link className="underline" href="/">
            Home
          </Link>
          {user.isAdmin && (
            <Link className="underline" href="/admin">
              Admin Dashboard
            </Link>
          )}
        </div>
      </section>
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-600">
          Order History
        </h2>
        <div className="rounded border p-6 text-sm text-neutral-500">
          No orders yet.
        </div>
      </section>
    </div>
  );
}
