import { SubcategoriesGrid } from "@/components/layout/SubcategoriesGrid";
import { prisma } from "@/lib/server/prisma";

export const dynamic = "force-dynamic";

export default async function MensPage() {
  // Fetch mens category and its subcategories from database
  let mensCategory;
  try {
    mensCategory = await prisma.category.findFirst({
      where: { slug: "mens" },
      include: {
        children: {
          where: { isActive: true },
          orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
          include: {
            _count: {
              select: { products: true },
            },
          },
        },
      },
    });
  } catch (error) {
    console.error("Database error in MensPage:", error);
    mensCategory = null;
  }

  const subcategories =
    mensCategory?.children.map((child) => ({
      name: child.name,
      slug: child.slug.replace("mens-", ""), // Remove prefix for URL
      href: `/mens/${child.slug.replace("mens-", "")}`,
      image:
        child.imageUrl ||
        `https://picsum.photos/seed/mens-${child.slug}/600/800`,
      description: child.description || `${child.name} collection`,
      productCount: child._count.products,
    })) || [];

  return (
    <SubcategoriesGrid title="Men's Fashion" subcategories={subcategories} />
  );
}
