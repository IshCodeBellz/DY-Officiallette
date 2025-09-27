"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ImageInput {
  url: string;
  alt?: string;
}
interface SizeInput {
  label: string;
  stock: number;
}

export const dynamic = "force-dynamic";

interface MetaBrand {
  id: string;
  name: string;
}
interface MetaCategory {
  id: string;
  name: string;
  slug: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [images, setImages] = useState<ImageInput[]>([{ url: "", alt: "" }]);
  const [sizes, setSizes] = useState<SizeInput[]>([{ label: "", stock: 0 }]);
  const [brandId, setBrandId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [brands, setBrands] = useState<MetaBrand[]>([]);
  const [categories, setCategories] = useState<MetaCategory[]>([]);
  useEffect(() => {
    fetch("/api/admin/meta")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        if (d.brands) setBrands(d.brands);
        if (d.categories) setCategories(d.categories);
      })
      .catch(() => {});
  }, []);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateImage(idx: number, patch: Partial<ImageInput>) {
    setImages((prev) =>
      prev.map((img, i) => (i === idx ? { ...img, ...patch } : img))
    );
  }
  function addImage() {
    setImages((p) => [...p, { url: "", alt: "" }]);
  }
  function removeImage(i: number) {
    setImages((p) => p.filter((_, idx) => idx !== i));
  }

  function updateSize(idx: number, patch: Partial<SizeInput>) {
    setSizes((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, ...patch } : s))
    );
  }
  function addSize() {
    setSizes((p) => [...p, { label: "", stock: 0 }]);
  }
  function removeSize(i: number) {
    setSizes((p) => p.filter((_, idx) => idx !== i));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const priceCents = Math.round(parseFloat(price) * 100);
      const payload = {
        sku: sku.trim(),
        name: name.trim(),
        description: description.trim(),
        priceCents,
        brandId: brandId || undefined,
        categoryId: categoryId || undefined,
        images: images
          .filter((i) => i.url.trim())
          .map((i, idx) => ({ ...i, position: idx })),
        sizes: sizes
          .filter((s) => s.label.trim())
          .map((s) => ({ label: s.label.trim(), stock: s.stock || 0 })),
      };
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data?.error === "sku_exists") setError("SKU already exists");
        else if (data?.error === "invalid_payload")
          setError("Validation failed");
        else if (data?.error === "forbidden") setError("Not an admin");
        else if (data?.error === "unauthorized") setError("Sign in required");
        else setError("Request failed");
      } else {
        router.push(`/admin/products`);
        router.refresh();
      }
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6">New Product</h1>
      <form onSubmit={onSubmit} className="space-y-8">
        <section className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">SKU</label>
              <input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                required
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Brand</label>
              <select
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                <option value="">(None)</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                <option value="">(None)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1 max-w-xs">
            <label className="text-sm font-medium">Price (USD)</label>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              type="number"
              step="0.01"
              min="0"
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-medium text-sm uppercase tracking-wide">
            Images
          </h2>
          <div className="space-y-4">
            {images.map((img, i) => (
              <div key={i} className="grid md:grid-cols-2 gap-3 items-start">
                <input
                  placeholder="Image URL"
                  value={img.url}
                  onChange={(e) => updateImage(i, { url: e.target.value })}
                  required={i === 0}
                  className="border rounded px-3 py-2 text-sm"
                />
                <div className="flex gap-2">
                  <input
                    placeholder="Alt text"
                    value={img.alt}
                    onChange={(e) => updateImage(i, { alt: e.target.value })}
                    className="border rounded px-3 py-2 text-sm flex-1"
                  />
                  {images.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="text-xs text-red-600 underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addImage}
              className="text-xs underline"
            >
              + Add Image
            </button>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-medium text-sm uppercase tracking-wide">Sizes</h2>
          <div className="space-y-3">
            {sizes.map((s, i) => (
              <div key={i} className="flex gap-3 items-center">
                <input
                  placeholder="Label"
                  value={s.label}
                  onChange={(e) => updateSize(i, { label: e.target.value })}
                  className="border rounded px-3 py-2 text-sm w-32"
                />
                <input
                  placeholder="Stock"
                  type="number"
                  min={0}
                  value={s.stock}
                  onChange={(e) =>
                    updateSize(i, { stock: parseInt(e.target.value || "0") })
                  }
                  className="border rounded px-3 py-2 text-sm w-32"
                />
                {sizes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSize(i)}
                    className="text-xs text-red-600 underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addSize}
              className="text-xs underline"
            >
              + Add Size
            </button>
          </div>
        </section>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button
            disabled={submitting}
            type="submit"
            className="rounded bg-neutral-900 text-white px-4 py-2 text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Product"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            className="text-sm underline"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
