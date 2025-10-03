import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/server/authOptions";
import { prisma } from "@/lib/server/prisma";
import CategoriesClient from ".";
import Link from "next/link";

export const dynamic = "force-dynamic";

// Metric Card Component
const MetricCard = ({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
}) => (
  <div className="bg-gradient-to-r from-green-50 to-teal-50 p-6 rounded-lg border border-gray-200">
    <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
  </div>
);

export default async function CategoriesAdminPage() {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin)
    return <div className="p-6">Unauthorized</div>;

  // Fetch categories with product counts
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          products: true,
        },
      },
    },
  });

  // Calculate metrics
  const totalCategories = categories.length;
  const totalProducts = categories.reduce(
    (sum, category) => sum + category._count.products,
    0
  );
  const avgProductsPerCategory =
    totalCategories > 0 ? Math.round(totalProducts / totalCategories) : 0;
  const activeCategories = categories.filter(
    (category) => category._count.products > 0
  ).length;

  const mapped = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    productCount: c._count.products,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Manage Categories
              </h1>
              <p className="text-gray-600 mt-1">
                Organize your products into categories for better navigation
              </p>
            </div>
            <Link
              href="/admin"
              className="text-sm rounded bg-neutral-200 text-neutral-900 px-3 py-2 hover:bg-neutral-300"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Metrics Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Categories"
            value={totalCategories}
            subtitle="All categories in system"
          />
          <MetricCard
            title="Active Categories"
            value={activeCategories}
            subtitle="Categories with products"
          />
          <MetricCard
            title="Total Products"
            value={totalProducts}
            subtitle="Across all categories"
          />
          <MetricCard
            title="Avg Products/Category"
            value={avgProductsPerCategory}
            subtitle="Products per category"
          />
        </div>

        {/* Categories Table Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              All Categories
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage and organize your product categories
            </p>
          </div>
          <div className="p-6">
            <CategoriesClient initial={mapped} />
          </div>
        </div>
      </div>
    </div>
  );
}
