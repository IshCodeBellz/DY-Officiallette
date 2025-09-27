"use client";
export const dynamic = "force-dynamic";
import { FormEvent, useState, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const { data: session } = useSession();
  const callbackUrl = search.get("callbackUrl") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid credentials");
    } else {
      // If user is admin and no explicit non-admin target, route to admin dashboard
      const isAdmin = (session?.user as any)?.isAdmin;
      if (
        isAdmin &&
        (callbackUrl === "/" || callbackUrl.startsWith("/login"))
      ) {
        router.push("/admin/products");
      } else {
        router.push(callbackUrl);
      }
      router.refresh();
    }
  }

  // If already logged in and admin, auto-redirect away from login
  if ((session?.user as any)?.isAdmin) {
    if (typeof window !== "undefined") {
      const target = search.get("callbackUrl");
      if (!target || target === "/" || target.startsWith("/login")) {
        router.replace("/admin/products");
      }
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold mb-6">Sign in</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border px-3 py-2 text-sm bg-white/50 focus:outline-none focus:ring focus:ring-neutral-300"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border px-3 py-2 text-sm bg-white/50 focus:outline-none focus:ring focus:ring-neutral-300"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-neutral-900 text-white py-2 text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <p className="text-sm text-neutral-600 mt-6">
        No account?{" "}
        <Link href="/register" className="underline font-medium">
          Register
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
