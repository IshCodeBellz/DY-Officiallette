"use client";
import { useState } from "react";

interface Brand {
  id: string;
  name: string;
}
export default function BrandsClient({ initial }: { initial: Brand[] }) {
  const [brands, setBrands] = useState<Brand[]>(initial);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createBrand() {
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/brands", {
      method: "POST",
      body: JSON.stringify({ name }),
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed");
    } else {
      const data = await res.json();
      setBrands((prev) =>
        [...prev, data.brand].sort((a, b) => a.name.localeCompare(b.name))
      );
      setName("");
    }
    setLoading(false);
  }

  async function rename(id: string, current: string) {
    const next = prompt("New brand name", current);
    if (!next || next === current) return;
    const res = await fetch("/api/admin/brands", {
      method: "PUT",
      body: JSON.stringify({ id, name: next }),
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      const data = await res.json();
      setBrands((prev) =>
        prev
          .map((b) => (b.id === id ? data.brand : b))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
    } else {
      alert("Rename failed");
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete brand? (must have no products)")) return;
    const res = await fetch(`/api/admin/brands?id=${id}`, { method: "DELETE" });
    if (res.ok) setBrands((prev) => prev.filter((b) => b.id !== id));
    else alert("Delete failed (in use or not found)");
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Manage Brands</h1>
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="block text-xs uppercase tracking-wide mb-1 text-neutral-600">
            Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="New brand name"
          />
        </div>
        <button
          disabled={loading}
          onClick={createBrand}
          className="px-4 py-2 text-sm rounded bg-neutral-900 text-white disabled:opacity-50"
        >
          Add
        </button>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left">
            <tr>
              <th className="py-2 px-3 font-medium">Name</th>
              <th className="py-2 px-3 font-medium w-32" />
            </tr>
          </thead>
          <tbody>
            {brands.map((b) => (
              <tr
                key={b.id}
                className="border-t last:border-b hover:bg-neutral-50/70"
              >
                <td className="py-2 px-3">{b.name}</td>
                <td className="py-2 px-3 text-right flex gap-2 justify-end">
                  <button
                    onClick={() => rename(b.id, b.name)}
                    className="text-[11px] underline"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => remove(b.id)}
                    className="text-[11px] text-red-600 underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {brands.length === 0 && (
              <tr>
                <td colSpan={2} className="py-6 text-center text-neutral-500">
                  No brands yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
