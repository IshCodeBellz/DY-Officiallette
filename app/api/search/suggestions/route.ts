import { NextRequest, NextResponse } from "next/server";
import { CacheService } from "@/lib/server/cacheService";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/server/authOptions";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 20);
    const categoryId = searchParams.get("category") || undefined;
    const brandId = searchParams.get("brand") || undefined;

    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        data: {
          suggestions: [],
          trending: await CacheService.getCachedTrendingSearches(limit),
          categories: await CacheService.getCachedCategories(),
          brands: await CacheService.getCachedBrands(),
        },
      });
    }

    // Search products with caching
    const products = await CacheService.searchProducts(
      query,
      categoryId,
      brandId,
      limit
    );

    // Track search for analytics
    if (userId) {
      await CacheService.trackSearch(query, userId, products.length);
    }

    // Format suggestions
    const suggestions = products.map((product) => ({
      id: product.id,
      name: product.name,
      price: product.priceCents,
      image: product.images[0]?.url || "/placeholder.svg",
      brand: product.brand?.name || "",
      category: product.category?.name || "",
    }));

    return NextResponse.json({
      success: true,
      data: {
        suggestions,
        trending: await CacheService.getCachedTrendingSearches(5),
        totalResults: products.length,
      },
    });
  } catch (error) {
    console.error("Search suggestions API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get search suggestions",
      },
      { status: 500 }
    );
  }
}
