import { prisma } from "./prisma";

export interface SearchFilters {
  query?: string;
  categoryId?: string;
  brandId?: string;
  priceMin?: number;
  priceMax?: number;
  colors?: string[];
  sizes?: string[];
  rating?: number;
  inStock?: boolean;
  featured?: boolean;
  sortBy?:
    | "relevance"
    | "price_asc"
    | "price_desc"
    | "newest"
    | "rating"
    | "popularity";
  page?: number;
  limit?: number;
}

export interface SearchResult {
  products: ProductSearchResult[];
  totalCount: number;
  facets: SearchFacets;
  suggestions?: string[];
  page: number;
  totalPages: number;
}

export interface ProductSearchResult {
  id: string;
  sku: string;
  name: string;
  description: string;
  priceCents: number;
  comparePriceCents?: number;
  brandName?: string;
  categoryName?: string;
  images: Array<{ url: string; alt?: string }>;
  rating?: number;
  reviewCount?: number;
  variants?: Array<{
    type: string;
    value: string;
    hexColor?: string;
    inStock: boolean;
  }>;
  isInStock: boolean;
  isFeatured: boolean;
  tags: string[];
}

export interface SearchFacets {
  categories: Array<{ id: string; name: string; count: number }>;
  brands: Array<{ id: string; name: string; count: number }>;
  priceRanges: Array<{ min: number; max: number; count: number }>;
  colors: Array<{ value: string; hexColor?: string; count: number }>;
  sizes: Array<{ value: string; count: number }>;
  ratings: Array<{ rating: number; count: number }>;
}

export interface SearchSuggestion {
  query: string;
  type: "product" | "category" | "brand";
  count: number;
}

/**
 * Advanced Search Service for Phase 3
 */
export class SearchService {
  /**
   * Perform advanced product search with filters
   */
  static async searchProducts(filters: SearchFilters): Promise<SearchResult> {
    try {
      const {
        query = "",
        categoryId,
        brandId,
        priceMin,
        priceMax,
        colors = [],
        sizes = [],
        rating,
        inStock,
        featured,
        sortBy = "relevance",
        page = 1,
        limit = 24,
      } = filters;

      const offset = (page - 1) * limit;

      // Build search conditions
      const where: any = {
        isActive: true,
        deletedAt: null,
      };

      // Text search
      if (query) {
        where.OR = [
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { tags: { contains: query, mode: "insensitive" } },
        ];
      }

      // Category filter
      if (categoryId) {
        where.categoryId = categoryId;
      }

      // Brand filter
      if (brandId) {
        where.brandId = brandId;
      }

      // Price range filter
      if (priceMin !== undefined || priceMax !== undefined) {
        where.priceCents = {};
        if (priceMin !== undefined) where.priceCents.gte = priceMin * 100;
        if (priceMax !== undefined) where.priceCents.lte = priceMax * 100;
      }

      // Featured filter
      if (featured) {
        where.isFeatured = true;
      }

      // Stock filter
      if (inStock) {
        where.variants = {
          some: {
            stock: { gt: 0 },
            isActive: true,
          },
        };
      }

      // Color filter
      if (colors.length > 0) {
        where.variants = {
          some: {
            type: "color",
            value: { in: colors },
            isActive: true,
          },
        };
      }

      // Size filter
      if (sizes.length > 0) {
        where.variants = {
          some: {
            type: "size",
            value: { in: sizes },
            isActive: true,
          },
        };
      }

      // Build sort order
      const orderBy = this.buildSortOrder(sortBy);

      // For now, return mock data since Prisma models aren't synced
      const mockProducts: ProductSearchResult[] = [
        {
          id: "prod_1",
          sku: "TSHIRT-001",
          name: "Premium Cotton T-Shirt",
          description: "High-quality cotton t-shirt with comfortable fit",
          priceCents: 2499,
          comparePriceCents: 2999,
          brandName: "Premium Brand",
          categoryName: "T-Shirts",
          images: [
            { url: "/images/tshirt-1.jpg", alt: "Premium Cotton T-Shirt" },
          ],
          rating: 4.5,
          reviewCount: 128,
          variants: [
            { type: "color", value: "Red", hexColor: "#FF0000", inStock: true },
            {
              type: "color",
              value: "Blue",
              hexColor: "#0000FF",
              inStock: true,
            },
            { type: "size", value: "M", inStock: true },
            { type: "size", value: "L", inStock: true },
          ],
          isInStock: true,
          isFeatured: true,
          tags: ["cotton", "casual", "comfortable"],
        },
        {
          id: "prod_2",
          sku: "JEANS-001",
          name: "Slim Fit Jeans",
          description: "Modern slim fit jeans with stretch fabric",
          priceCents: 4999,
          brandName: "Denim Co",
          categoryName: "Jeans",
          images: [{ url: "/images/jeans-1.jpg", alt: "Slim Fit Jeans" }],
          rating: 4.2,
          reviewCount: 89,
          variants: [
            {
              type: "color",
              value: "Dark Blue",
              hexColor: "#1e3a8a",
              inStock: true,
            },
            { type: "size", value: "32", inStock: true },
            { type: "size", value: "34", inStock: false },
          ],
          isInStock: true,
          isFeatured: false,
          tags: ["denim", "slim", "stretch"],
        },
      ];

      // Apply filters to mock data
      let filteredProducts = mockProducts;

      if (query) {
        filteredProducts = filteredProducts.filter(
          (p) =>
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.description.toLowerCase().includes(query.toLowerCase()) ||
            p.tags.some((tag) =>
              tag.toLowerCase().includes(query.toLowerCase())
            )
        );
      }

      if (colors.length > 0) {
        filteredProducts = filteredProducts.filter((p) =>
          p.variants?.some(
            (v) => v.type === "color" && colors.includes(v.value)
          )
        );
      }

      if (sizes.length > 0) {
        filteredProducts = filteredProducts.filter((p) =>
          p.variants?.some((v) => v.type === "size" && sizes.includes(v.value))
        );
      }

      if (priceMin !== undefined) {
        filteredProducts = filteredProducts.filter(
          (p) => p.priceCents >= priceMin * 100
        );
      }

      if (priceMax !== undefined) {
        filteredProducts = filteredProducts.filter(
          (p) => p.priceCents <= priceMax * 100
        );
      }

      if (featured) {
        filteredProducts = filteredProducts.filter((p) => p.isFeatured);
      }

      if (inStock) {
        filteredProducts = filteredProducts.filter((p) => p.isInStock);
      }

      // Apply sorting
      filteredProducts = this.applySorting(filteredProducts, sortBy);

      // Pagination
      const totalCount = filteredProducts.length;
      const paginatedProducts = filteredProducts.slice(offset, offset + limit);

      // Generate facets
      const facets = this.generateMockFacets(mockProducts);

      // Generate suggestions
      const suggestions = this.generateSearchSuggestions(query);

      return {
        products: paginatedProducts,
        totalCount,
        facets,
        suggestions,
        page,
        totalPages: Math.ceil(totalCount / limit),
      };
    } catch (error) {
      console.error("Error:", error);
      console.error("Search error:", error);

      return {
        products: [],
        totalCount: 0,
        facets: this.getEmptyFacets(),
        page: 1,
        totalPages: 0,
      };
    }
  }

  /**
   * Get search suggestions
   */
  static async getSearchSuggestions(
    query: string,
    limit: number = 10
  ): Promise<SearchSuggestion[]> {
    try {
      if (!query || query.length < 2) {
        return [];
      }

      // Mock suggestions
      const mockSuggestions: SearchSuggestion[] = [
        { query: "t-shirt", type: "product", count: 45 },
        { query: "jeans", type: "product", count: 32 },
        { query: "sneakers", type: "product", count: 28 },
        { query: "dress", type: "product", count: 56 },
        { query: "jacket", type: "product", count: 23 },
        { query: "Premium Brand", type: "brand", count: 15 },
        { query: "Casual Wear", type: "category", count: 78 },
      ];

      return mockSuggestions
        .filter((s) => s.query.toLowerCase().includes(query.toLowerCase()))
        .slice(0, limit);
    } catch (error) {
      console.error("Error:", error);
      console.error("Search suggestions error:", error);
      return [];
    }
  }

  /**
   * Get trending searches
   */
  static async getTrendingSearches(limit: number = 10): Promise<string[]> {
    try {
      // Mock trending searches
      return [
        "summer dress",
        "wireless headphones",
        "running shoes",
        "laptop bag",
        "sunglasses",
        "winter jacket",
        "bluetooth speaker",
        "watch",
        "backpack",
        "phone case",
      ].slice(0, limit);
    } catch (error) {
      console.error("Error:", error);
      console.error("Trending searches error:", error);
      return [];
    }
  }

  /**
   * Log search event for analytics
   */
  static async logSearchEvent(
    query: string,
    userId?: string,
    sessionId?: string,
    resultsCount?: number
  ): Promise<void> {
    try {
      // In production, this would log to analytics database
      console.log("Search Event:", {
        query,
        userId,
        sessionId,
        resultsCount,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Error:", error);
      console.error("Search logging error:", error);
    }
  }

  /**
   * Build sort order for query
   */
  private static buildSortOrder(sortBy: string) {
    switch (sortBy) {
      case "price_asc":
        return { priceCents: "asc" };
      case "price_desc":
        return { priceCents: "desc" };
      case "newest":
        return { createdAt: "desc" };
      case "rating":
        return { metrics: { rating: "desc" } };
      case "popularity":
        return { metrics: { views: "desc" } };
      case "relevance":
      default:
        return { name: "asc" };
    }
  }

  /**
   * Apply sorting to products array
   */
  private static applySorting(
    products: ProductSearchResult[],
    sortBy: string
  ): ProductSearchResult[] {
    switch (sortBy) {
      case "price_asc":
        return products.sort((a, b) => a.priceCents - b.priceCents);
      case "price_desc":
        return products.sort((a, b) => b.priceCents - a.priceCents);
      case "rating":
        return products.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case "newest":
        return products; // Already in newest order
      case "popularity":
        return products.sort(
          (a, b) => (b.reviewCount || 0) - (a.reviewCount || 0)
        );
      case "relevance":
      default:
        return products;
    }
  }

  /**
   * Generate mock facets for search results
   */
  private static generateMockFacets(
    products: ProductSearchResult[]
  ): SearchFacets {
    return {
      categories: [
        { id: "cat_1", name: "T-Shirts", count: 45 },
        { id: "cat_2", name: "Jeans", count: 32 },
        { id: "cat_3", name: "Dresses", count: 28 },
        { id: "cat_4", name: "Sneakers", count: 56 },
      ],
      brands: [
        { id: "brand_1", name: "Premium Brand", count: 23 },
        { id: "brand_2", name: "Denim Co", count: 18 },
        { id: "brand_3", name: "Sport Plus", count: 34 },
      ],
      priceRanges: [
        { min: 0, max: 25, count: 45 },
        { min: 25, max: 50, count: 67 },
        { min: 50, max: 100, count: 34 },
        { min: 100, max: 200, count: 12 },
      ],
      colors: [
        { value: "Red", hexColor: "#FF0000", count: 23 },
        { value: "Blue", hexColor: "#0000FF", count: 34 },
        { value: "Black", hexColor: "#000000", count: 45 },
        { value: "White", hexColor: "#FFFFFF", count: 56 },
      ],
      sizes: [
        { value: "XS", count: 12 },
        { value: "S", count: 34 },
        { value: "M", count: 67 },
        { value: "L", count: 45 },
        { value: "XL", count: 23 },
      ],
      ratings: [
        { rating: 5, count: 23 },
        { rating: 4, count: 45 },
        { rating: 3, count: 34 },
        { rating: 2, count: 12 },
        { rating: 1, count: 5 },
      ],
    };
  }

  /**
   * Generate search suggestions based on query
   */
  private static generateSearchSuggestions(query: string): string[] {
    if (!query || query.length < 2) {
      return [];
    }

    const suggestions = [
      "cotton t-shirt",
      "slim jeans",
      "summer dress",
      "running shoes",
      "winter jacket",
      "casual shirt",
      "formal pants",
      "sneakers",
    ];

    return suggestions
      .filter((s) => s.includes(query.toLowerCase()))
      .slice(0, 5);
  }

  /**
   * Get empty facets structure
   */
  private static getEmptyFacets(): SearchFacets {
    return {
      categories: [],
      brands: [],
      priceRanges: [],
      colors: [],
      sizes: [],
      ratings: [],
    };
  }

  /**
   * Get search analytics data
   */
  async getSearchAnalytics() {
    try {
      // Get real analytics data from user behavior tracking
      const [totalSearches, searchBehaviors, totalViews, totalPurchases] =
        await Promise.all([
          prisma.userBehavior.count({
            where: { eventType: "search" },
          }),
          prisma.userBehavior.findMany({
            where: { eventType: "search" },
            select: { metadata: true },
          }),
          prisma.userBehavior.count({
            where: { eventType: "view" },
          }),
          prisma.userBehavior.count({
            where: { eventType: "purchase" },
          }),
        ]);

      // Calculate average results per search from metadata
      const searchResultCounts = searchBehaviors
        .map((behavior) => {
          try {
            const metadata = JSON.parse(behavior.metadata || "{}");
            return metadata.resultCount || 0;
          } catch {
            return 0;
          }
        })
        .filter((count) => count > 0);

      const avgResultsPerSearch =
        searchResultCounts.length > 0
          ? searchResultCounts.reduce((sum, count) => sum + count, 0) /
            searchResultCounts.length
          : 0;

      // Calculate click-through rate (views/searches)
      const clickThroughRate =
        totalSearches > 0 ? Math.round((totalViews / totalSearches) * 100) : 0;

      // Calculate no results rate (searches with 0 results)
      const noResultsCount = searchResultCounts.filter(
        (count) => count === 0
      ).length;
      const noResultsRate =
        totalSearches > 0
          ? Math.round((noResultsCount / totalSearches) * 100)
          : 0;

      return {
        totalSearches,
        avgResultsPerSearch: Math.round(avgResultsPerSearch * 10) / 10,
        noResultsRate,
        clickThroughRate,
      };
    } catch (error) {
      console.error("Error:", error);
      console.error("Get search analytics error:", error);
      // Fallback to mock data
      return {
        totalSearches: 0,
        avgResultsPerSearch: 0,
        noResultsRate: 0,
        clickThroughRate: 0,
      };
    }
  }

  /**
   * Get trending search queries
   */
  async getTrendingQueries(limit = 10) {
    try {
      // Get search queries from user behavior data
      const searchBehaviors = await prisma.userBehavior.findMany({
        where: { eventType: "search" },
        select: { metadata: true, timestamp: true, searchQuery: true },
        orderBy: { timestamp: "desc" },
        take: 1000, // Get recent searches to analyze trends
      });

      // Extract and count search queries
      const queryMap = new Map<
        string,
        { count: number; recent: number; old: number }
      >();
      const now = Date.now();
      const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

      searchBehaviors.forEach((behavior) => {
        try {
          // Use searchQuery field or fallback to metadata
          const query =
            behavior.searchQuery?.toLowerCase()?.trim() ||
            (() => {
              try {
                const metadata = JSON.parse(behavior.metadata || "{}");
                return metadata.query?.toLowerCase()?.trim();
              } catch {
                return null;
              }
            })();

          if (query && query.length > 0) {
            const isRecent = behavior.timestamp.getTime() > oneWeekAgo;
            const current = queryMap.get(query) || {
              count: 0,
              recent: 0,
              old: 0,
            };

            current.count++;
            if (isRecent) {
              current.recent++;
            } else {
              current.old++;
            }

            queryMap.set(query, current);
          }
        } catch {
          // Skip invalid data
        }
      });

      // Calculate trends and sort by popularity
      const queries = Array.from(queryMap.entries())
        .map(([query, data]) => ({
          query,
          count: data.count,
          trend:
            data.old > 0
              ? Math.round(((data.recent - data.old) / data.old) * 100)
              : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);

      return queries;
    } catch (error) {
      console.error("Error:", error);
      console.error("Get trending queries error:", error);
      // Fallback to mock data
      return [{ query: "No data available", count: 0, trend: 0 }];
    }
  }

  /**
   * Get popular filter usage
   */
  async getPopularFilters() {
    // Mock filter analytics - in production, this would analyze filter usage
    return [
      {
        type: "Brand",
        values: [
          { value: "Premium Brand", count: 345 },
          { value: "Sport Plus", count: 287 },
          { value: "Denim Co", count: 234 },
        ],
      },
      {
        type: "Size",
        values: [
          { value: "M", count: 567 },
          { value: "L", count: 432 },
          { value: "S", count: 398 },
        ],
      },
      {
        type: "Color",
        values: [
          { value: "Black", count: 678 },
          { value: "Blue", count: 456 },
          { value: "White", count: 387 },
        ],
      },
    ];
  }
}
