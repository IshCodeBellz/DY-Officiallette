"use client";
export const dynamic = "force-dynamic";
import { FormEvent, useState } from "react";
import Link from "next/link";
// No auto sign-in; require email verification first.

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pendingVerify, setPendingVerify] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 chars");
      return;
    }
    if (password !== password2) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name: name || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data?.error === "email_exists")
          setError("Email already registered");
        else setError("Registration failed");
      } else {
        if (data.status === "pending_verification") {
          setSuccess(true);
          setPendingVerify(true);
        } else {
          setSuccess(true);
        }
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold mb-6">Create your account</h1>
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
          <label className="text-sm font-medium">Name (optional)</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
        <div className="space-y-1">
          <label className="text-sm font-medium">Confirm Password</label>
          <input
            type="password"
            required
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            className="w-full rounded border px-3 py-2 text-sm bg-white/50 focus:outline-none focus:ring focus:ring-neutral-300"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && pendingVerify && (
          <div className="p-3 rounded bg-blue-50 border border-blue-200 text-blue-700 text-sm">
            Registration received. Check your email for a verification link to
            activate your account.
          </div>
        )}
        {success && !pendingVerify && (
          <p className="text-sm text-green-600">Registered.</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-neutral-900 text-white py-2 text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Create account"}
        </button>
      </form>
      <p className="text-sm text-neutral-600 mt-6">
        Already have an account?{" "}
        <Link href="/login" className="underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
