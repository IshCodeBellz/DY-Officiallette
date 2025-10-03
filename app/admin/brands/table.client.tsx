"use client";
import { useState } from "react";

interface Brand {
  id: string;
  name: string;
  productCount?: number;
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
        [...prev, { ...data.brand, productCount: 0 }].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
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
          .map((b) =>
            b.id === id ? { ...data.brand, productCount: b.productCount } : b
          )
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
    <div className="space-y-6">
      {/* Add New Brand Section */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Add New Brand
        </h3>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brand Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter brand name"
              onKeyPress={(e) => e.key === "Enter" && createBrand()}
            />
          </div>
          <button
            disabled={loading || !name.trim()}
            onClick={createBrand}
            className="px-6 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Adding..." : "Add Brand"}
          </button>
        </div>
        {error && (
          <div className="mt-3 text-sm text-red-600 bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}
      </div>

      {/* Brands Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Brand Name
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
              {brands.map((brand) => (
                <tr
                  key={brand.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {brand.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {brand.productCount || 0}{" "}
                      {brand.productCount === 1 ? "product" : "products"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        (brand.productCount || 0) > 0
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {(brand.productCount || 0) > 0 ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => rename(brand.id, brand.name)}
                        className="text-blue-600 hover:text-blue-900 font-medium transition-colors"
                      >
                        Rename
                      </button>
                      <button
                        onClick={() => remove(brand.id)}
                        className="text-red-600 hover:text-red-900 font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {brands.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <div className="text-lg font-medium mb-2">
                        No brands found
                      </div>
                      <div className="text-sm">
                        Get started by adding your first brand above.
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
