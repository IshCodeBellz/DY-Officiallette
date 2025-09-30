"use client";
import { useState } from "react";

interface Category {
  id: string;
  name: string;
  slug: string;
}
export default function CategoriesClient({ initial }: { initial: Category[] }) {
  const [categories, setCategories] = useState<Category[]>(initial);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function slugify(v: string) {
    return v
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
  }

  async function createCategory() {
    if (!name.trim() || !slug.trim()) return;
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      body: JSON.stringify({ name, slug }),
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Failed");
    } else {
      const data = await res.json();
      setCategories((prev) =>
        [...prev, data.category].sort((a, b) => a.name.localeCompare(b.name))
      );
      setName("");
      setSlug("");
    }
    setLoading(false);
  }

  async function rename(id: string, current: string) {
    const next = prompt("New category name", current);
    if (!next || next === current) return;
    const res = await fetch("/api/admin/categories", {
      method: "PUT",
      body: JSON.stringify({ id, name: next }),
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      const data = await res.json();
      setCategories((prev) =>
        prev
          .map((c) => (c.id === id ? { ...c, name: data.category.name } : c))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
    } else {
      alert("Rename failed");
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete category? (must have no products)")) return;
    const res = await fetch(`/api/admin/categories?id=${id}`, {
      method: "DELETE",
    });
    if (res.ok) setCategories((prev) => prev.filter((c) => c.id !== id));
    else alert("Delete failed (in use or not found)");
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">
        Manage Categories
      </h1>
      <div className="grid gap-4 md:grid-cols-2 items-end">
        <div>
          <label className="block text-xs uppercase tracking-wide mb-1 text-neutral-600">
            Name
          </label>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slug) setSlug(slugify(e.target.value));
            }}
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="Category name"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wide mb-1 text-neutral-600">
            Slug
          </label>
          <input
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
            className="w-full border rounded px-3 py-2 text-sm font-mono"
            placeholder="auto-generated"
          />
        </div>
        <div className="md:col-span-2 flex gap-2">
          <button
            disabled={loading}
            onClick={createCategory}
            className="px-4 py-2 text-sm rounded bg-neutral-900 text-white disabled:opacity-50"
          >
            Add
          </button>
          {error && (
            <div className="text-sm text-red-600 self-center">{error}</div>
          )}
        </div>
      </div>
      <div className="border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left">
            <tr>
              <th className="py-2 px-3 font-medium">Name</th>
              <th className="py-2 px-3 font-medium">Slug</th>
              <th className="py-2 px-3 font-medium w-32" />
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr
                key={c.id}
                className="border-t last:border-b hover:bg-neutral-50/70"
              >
                <td className="py-2 px-3">{c.name}</td>
                <td className="py-2 px-3 font-mono text-[11px]">{c.slug}</td>
                <td className="py-2 px-3 text-right flex gap-2 justify-end">
                  <button
                    onClick={() => rename(c.id, c.name)}
                    className="text-[11px] underline"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => remove(c.id)}
                    className="text-[11px] text-red-600 underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={3} className="py-6 text-center text-neutral-500">
                  No categories yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
