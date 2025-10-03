"use client";
import { useState } from "react";

interface Category {
  id: string;
  name: string;
  slug: string;
  productCount?: number;
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
        [...prev, { ...data.category, productCount: 0 }].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
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
    <div className="space-y-6">
      {/* Add New Category Section */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Add New Category
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category Name
            </label>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slug) setSlug(slugify(e.target.value));
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter category name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL Slug
            </label>
            <input
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="auto-generated-slug"
            />
          </div>
        </div>
        <div className="mt-4 flex gap-3 items-center">
          <button
            disabled={loading || !name.trim() || !slug.trim()}
            onClick={createCategory}
            className="px-6 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Adding..." : "Add Category"}
          </button>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  URL Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Products
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.map((category) => (
                <tr
                  key={category.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {category.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded">
                      {category.slug}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {category.productCount || 0}{" "}
                      {category.productCount === 1 ? "product" : "products"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        (category.productCount || 0) > 0
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {(category.productCount || 0) > 0 ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => rename(category.id, category.name)}
                        className="text-blue-600 hover:text-blue-900 font-medium transition-colors"
                      >
                        Rename
                      </button>
                      <button
                        onClick={() => remove(category.id)}
                        className="text-red-600 hover:text-red-900 font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <div className="text-lg font-medium mb-2">
                        No categories found
                      </div>
                      <div className="text-sm">
                        Get started by adding your first category above.
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
