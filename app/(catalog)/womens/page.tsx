import { SubcategoriesGrid } from "@/components/layout/SubcategoriesGrid";
import { prisma } from "@/lib/server/prisma";

export const dynamic = 'force-dynamic';

export default async function WomensPage() {
  // Fetch womens category and its subcategories from database
  let womensCategory;
  try {
    womensCategory = await prisma.category.findFirst({
      where: { slug: "womens" },
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
    console.error("Database error in WomensPage:", error);
    womensCategory = null;
  }

  const subcategories =
    womensCategory?.children.map((child) => ({
      name: child.name,
      slug: child.slug.replace("womens-", ""), // Remove prefix for URL
      href: `/womens/${child.slug.replace("womens-", "")}`,
      image:
        child.imageUrl ||
        `https://picsum.photos/seed/womens-${child.slug}/600/800`,
      description: child.description || `${child.name} collection`,
      productCount: child._count.products,
    })) || [];

  return (
    <SubcategoriesGrid title="Women's Fashion" subcategories={subcategories} />
  );
}
