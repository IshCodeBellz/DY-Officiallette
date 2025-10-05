import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

export async function GET() {
  try {
    // Get all brands with their product counts (only active, non-deleted products)
    const brands = await prisma.brand.findMany({
      select: {
        id: true,
        name: true,
        logoUrl: true,
        backgroundImage: true,
        description: true,
        isFeatured: true,
        displayOrder: true,
        _count: {
          select: {
            products: {
              where: {
                isActive: true,
                deletedAt: null,
              },
            },
          },
        },
      },
      orderBy: [
        {
          isFeatured: "desc", // Featured brands first
        },
        {
          displayOrder: "asc", // Then by display order
        },
        {
          products: {
            _count: "desc", // Then by product count
          },
        },
        {
          name: "asc", // Finally alphabetically
        },
      ],
    });

    // Transform the data to match our interface
    const transformedBrands = brands
      .filter((brand) => brand._count.products > 0) // Only include brands with products
      .map((brand) => ({
        id: brand.id,
        name: brand.name,
        logoUrl: brand.logoUrl,
        backgroundImage: brand.backgroundImage,
        description: brand.description,
        isFeatured: brand.isFeatured,
        displayOrder: brand.displayOrder,
        productCount: brand._count.products,
      }));

    return NextResponse.json({
      brands: transformedBrands,
      total: transformedBrands.length,
    });
  } catch (error) {
    console.error("Failed to fetch brands:", error);
    return NextResponse.json(
      { error: "Failed to fetch brands" },
      { status: 500 }
    );
  }
}
