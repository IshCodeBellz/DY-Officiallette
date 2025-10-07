import { prisma } from "./prisma";

export interface UserBehaviorData {
  views: number;
  purchases: number;
  wishlistAdds: number;
  cartAdds: number;
  searchQueries: string[];
  categoryPreferences: Record<string, number>;
  brandPreferences: Record<string, number>;
  priceRange: { min: number; max: number };
  sizePreferences: string[];
  colorPreferences: string[];
}

export interface PersonalizationPreferences {
  categories: Array<{ id: string; name: string; score: number }>;
  brands: Array<{ id: string; name: string; score: number }>;
  priceRange: { min: number; max: number };
  sizes: Array<{ value: string; frequency: number }>;
  colors: Array<{ value: string; hexColor?: string; frequency: number }>;
  styles: Array<{ tag: string; score: number }>;
}

export interface RecommendationResult {
  products: RecommendedProduct[];
  reasons: Array<{ type: string; message: string; confidence: number }>;
  strategy: string;
}

export interface RecommendedProduct {
  id: string;
  name: string;
  priceCents: number;
  image: string;
  brandName?: string;
  categoryName?: string;
  rating?: number;
  reasonScore: number;
  matchReasons: string[];
}

/**
 * Personalization Engine for Phase 3
 */
export class PersonalizationService {
  /**
   * Get personalized product recommendations for user
   */
  static async getPersonalizedRecommendations(
    userId: string,
    options: {
      limit?: number;
      strategy?: "collaborative" | "content" | "hybrid" | "trending";
      excludeProductIds?: string[];
      categoryId?: string;
    } = {}
  ): Promise<RecommendationResult> {
    try {
      const {
        limit = 12,
        strategy = "hybrid",
        excludeProductIds = [],
        categoryId,
      } = options;

      // Get user behavior data
      const userBehavior = await this.getUserBehaviorData(userId);
      const preferences = await this.getUserPreferences(userId);

      // Apply recommendation strategy
      let products: RecommendedProduct[] = [];
      let reasons: Array<{
        type: string;
        message: string;
        confidence: number;
      }> = [];

      switch (strategy) {
        case "collaborative":
          ({ products, reasons } = await this.getCollaborativeRecommendations(
            userId,
            userBehavior,
            limit,
            excludeProductIds
          ));
          break;
        case "content":
          ({ products, reasons } = await this.getContentBasedRecommendations(
            preferences,
            limit,
            excludeProductIds,
            categoryId
          ));
          break;
        case "trending":
          ({ products, reasons } = await this.getTrendingRecommendations(
            preferences,
            limit,
            excludeProductIds
          ));
          break;
        case "hybrid":
        default:
          ({ products, reasons } = await this.getHybridRecommendations(
            userId,
            userBehavior,
            preferences,
            limit,
            excludeProductIds,
            categoryId
          ));
          break;
      }

      return {
        products: products.slice(0, limit),
        reasons,
        strategy,
      };
    } catch (error) {
      console.error("Error:", error);
      console.error("Personalization error:", error);

      // Fallback to trending products
      return {
        products: await this.getFallbackRecommendations(options.limit || 12),
        reasons: [
          {
            type: "fallback",
            message: "Showing trending products",
            confidence: 0.5,
          },
        ],
        strategy: "fallback",
      };
    }
  }

  /**
   * Get user behavior analytics
   */
  static async getUserBehaviorData(userId: string): Promise<UserBehaviorData> {
    try {
      // Mock behavior data since UserBehavior model not synced yet
      return {
        views: 45,
        purchases: 3,
        wishlistAdds: 8,
        cartAdds: 12,
        searchQueries: ["t-shirt", "jeans", "sneakers", "jacket"],
        categoryPreferences: {
          cat_1: 0.8, // T-Shirts
          cat_2: 0.6, // Jeans
          cat_3: 0.4, // Sneakers
        },
        brandPreferences: {
          brand_1: 0.9, // Premium Brand
          brand_2: 0.7, // Denim Co
        },
        priceRange: { min: 20, max: 80 },
        sizePreferences: ["M", "L"],
        colorPreferences: ["Blue", "Black", "White"],
      };
    } catch (error) {
      console.error("Error:", error);
      console.error("User behavior data error:", error);
      return this.getDefaultBehaviorData();
    }
  }

  /**
   * Get user preferences based on behavior
   */
  static async getUserPreferences(
    userId: string
  ): Promise<PersonalizationPreferences> {
    try {
      const behavior = await this.getUserBehaviorData(userId);

      return {
        categories: [
          { id: "cat_1", name: "T-Shirts", score: 0.8 },
          { id: "cat_2", name: "Jeans", score: 0.6 },
          { id: "cat_3", name: "Sneakers", score: 0.4 },
        ],
        brands: [
          { id: "brand_1", name: "Premium Brand", score: 0.9 },
          { id: "brand_2", name: "Denim Co", score: 0.7 },
        ],
        priceRange: behavior.priceRange,
        sizes: behavior.sizePreferences.map((size) => ({
          value: size,
          frequency: 1,
        })),
        colors: behavior.colorPreferences.map((color) => ({
          value: color,
          frequency: 1,
          hexColor: this.getColorHex(color),
        })),
        styles: [
          { tag: "casual", score: 0.8 },
          { tag: "comfortable", score: 0.7 },
          { tag: "modern", score: 0.6 },
        ],
      };
    } catch (error) {
      console.error("Error:", error);
      console.error("User preferences error:", error);
      return this.getDefaultPreferences();
    }
  }

  /**
   * Collaborative filtering recommendations
   */
  private static async getCollaborativeRecommendations(
    userId: string,
    userBehavior: UserBehaviorData,
    limit: number,
    excludeIds: string[]
  ): Promise<{
    products: RecommendedProduct[];
    reasons: Array<{ type: string; message: string; confidence: number }>;
  }> {
    // Mock collaborative filtering
    const products: RecommendedProduct[] = [
      {
        id: "prod_3",
        name: "Similar Users Loved This Shirt",
        priceCents: 3499,
        image: "/images/collab-shirt.jpg",
        brandName: "Trendy Brand",
        categoryName: "Shirts",
        rating: 4.6,
        reasonScore: 0.85,
        matchReasons: [
          "Users with similar taste bought this",
          "High rating from similar users",
        ],
      },
    ];

    const reasons = [
      {
        type: "collaborative",
        message: "Based on users with similar preferences",
        confidence: 0.8,
      },
    ];

    return { products, reasons };
  }

  /**
   * Content-based recommendations
   */
  private static async getContentBasedRecommendations(
    preferences: PersonalizationPreferences,
    limit: number,
    excludeIds: string[],
    categoryId?: string
  ): Promise<{
    products: RecommendedProduct[];
    reasons: Array<{ type: string; message: string; confidence: number }>;
  }> {
    // Mock content-based filtering
    const products: RecommendedProduct[] = [
      {
        id: "prod_4",
        name: "Perfect Match T-Shirt",
        priceCents: 2999,
        image: "/images/content-tshirt.jpg",
        brandName: "Premium Brand",
        categoryName: "T-Shirts",
        rating: 4.4,
        reasonScore: 0.9,
        matchReasons: [
          "Matches your favorite brand",
          "In your preferred price range",
          "Your favorite category",
        ],
      },
    ];

    const reasons = [
      {
        type: "content",
        message: "Matches your preferences",
        confidence: 0.85,
      },
    ];

    return { products, reasons };
  }

  /**
   * Trending recommendations with personalization
   */
  private static async getTrendingRecommendations(
    preferences: PersonalizationPreferences,
    limit: number,
    excludeIds: string[]
  ): Promise<{
    products: RecommendedProduct[];
    reasons: Array<{ type: string; message: string; confidence: number }>;
  }> {
    // Mock trending with personalization
    const products: RecommendedProduct[] = [
      {
        id: "prod_5",
        name: "Trending Denim Jacket",
        priceCents: 6999,
        image: "/images/trending-jacket.jpg",
        brandName: "Fashion Forward",
        categoryName: "Jackets",
        rating: 4.3,
        reasonScore: 0.7,
        matchReasons: ["Trending now", "Popular in your area"],
      },
    ];

    const reasons = [
      {
        type: "trending",
        message: "Popular products right now",
        confidence: 0.7,
      },
    ];

    return { products, reasons };
  }

  /**
   * Hybrid recommendations combining multiple strategies
   */
  private static async getHybridRecommendations(
    userId: string,
    userBehavior: UserBehaviorData,
    preferences: PersonalizationPreferences,
    limit: number,
    excludeIds: string[],
    categoryId?: string
  ): Promise<{
    products: RecommendedProduct[];
    reasons: Array<{ type: string; message: string; confidence: number }>;
  }> {
    // Combine multiple recommendation strategies
    const contentLimit = Math.ceil(limit * 0.4);
    const collabLimit = Math.ceil(limit * 0.3);
    const trendingLimit = limit - contentLimit - collabLimit;

    const [contentRecs, collabRecs, trendingRecs] = await Promise.all([
      this.getContentBasedRecommendations(
        preferences,
        contentLimit,
        excludeIds,
        categoryId
      ),
      this.getCollaborativeRecommendations(
        userId,
        userBehavior,
        collabLimit,
        excludeIds
      ),
      this.getTrendingRecommendations(preferences, trendingLimit, excludeIds),
    ]);

    // Combine and deduplicate
    const allProducts = [
      ...contentRecs.products,
      ...collabRecs.products,
      ...trendingRecs.products,
    ];

    const uniqueProducts = allProducts.filter(
      (product, index, self) =>
        index === self.findIndex((p) => p.id === product.id)
    );

    // Sort by reason score
    uniqueProducts.sort((a, b) => b.reasonScore - a.reasonScore);

    const reasons = [
      {
        type: "hybrid",
        message: "Personalized mix of recommendations",
        confidence: 0.8,
      },
    ];

    return {
      products: uniqueProducts.slice(0, limit),
      reasons,
    };
  }

  /**
   * Fallback recommendations when personalization fails
   */
  private static async getFallbackRecommendations(
    limit: number
  ): Promise<RecommendedProduct[]> {
    return [
      {
        id: "prod_fallback_1",
        name: "Popular Cotton T-Shirt",
        priceCents: 2499,
        image: "/images/fallback-tshirt.jpg",
        brandName: "Basic Brand",
        categoryName: "T-Shirts",
        rating: 4.0,
        reasonScore: 0.5,
        matchReasons: ["Popular choice"],
      },
      {
        id: "prod_fallback_2",
        name: "Best Selling Jeans",
        priceCents: 4999,
        image: "/images/fallback-jeans.jpg",
        brandName: "Denim Co",
        categoryName: "Jeans",
        rating: 4.2,
        reasonScore: 0.5,
        matchReasons: ["Best seller"],
      },
    ].slice(0, limit);
  }

  /**
   * Track user interaction for personalization learning
   */
  static async trackUserInteraction(
    userId: string,
    productId: string,
    interactionType:
      | "view"
      | "cart_add"
      | "wishlist_add"
      | "purchase"
      | "search"
  ): Promise<void> {
    try {
      // In production, this would update UserBehavior model
      console.log("User interaction tracked:", {
        userId,
        productId,
        interactionType,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Error:", error);
      console.error("Interaction tracking error:", error);
    }
  }

  /**
   * Get recommended searches based on user behavior
   */
  static async getRecommendedSearches(
    userId: string,
    limit: number = 5
  ): Promise<string[]> {
    try {
      const behavior = await this.getUserBehaviorData(userId);

      // Generate search recommendations based on behavior
      const searchRecommendations = [
        ...behavior.searchQueries,
        "new arrivals",
        "sale items",
        "trending now",
      ];

      return searchRecommendations.slice(0, limit);
    } catch (error) {
      console.error("Error:", error);
      console.error("Recommended searches error:", error);
      return ["t-shirt", "jeans", "sneakers", "dress", "jacket"];
    }
  }

  /**
   * Helper methods
   */
  private static getDefaultBehaviorData(): UserBehaviorData {
    return {
      views: 0,
      purchases: 0,
      wishlistAdds: 0,
      cartAdds: 0,
      searchQueries: [],
      categoryPreferences: {},
      brandPreferences: {},
      priceRange: { min: 0, max: 1000 },
      sizePreferences: [],
      colorPreferences: [],
    };
  }

  private static getDefaultPreferences(): PersonalizationPreferences {
    return {
      categories: [],
      brands: [],
      priceRange: { min: 0, max: 1000 },
      sizes: [],
      colors: [],
      styles: [],
    };
  }

  private static getColorHex(colorName: string): string {
    const colorMap: Record<string, string> = {
      Red: "#FF0000",
      Blue: "#0000FF",
      Black: "#000000",
      White: "#FFFFFF",
      Green: "#008000",
      Yellow: "#FFFF00",
      Purple: "#800080",
      Pink: "#FFC0CB",
      Orange: "#FFA500",
      Brown: "#A52A2A",
    };
    return colorMap[colorName] || "#CCCCCC";
  }

  /**
   * Analytics methods for admin interface
   */
  async getAlgorithmPerformance() {
    // Mock algorithm performance data - in production, this would query analytics
    return [
      {
        name: "Collaborative Filtering",
        status: "active",
        clickRate: 12.5,
        conversionRate: 3.2,
        coverage: 89,
      },
      {
        name: "Content-Based",
        status: "active",
        clickRate: 8.7,
        conversionRate: 2.8,
        coverage: 95,
      },
      {
        name: "Hybrid Model",
        status: "active",
        clickRate: 15.3,
        conversionRate: 4.1,
        coverage: 92,
      },
    ];
  }

  async getUserSegments() {
    // Mock user segmentation data - in production, this would analyze user behavior
    return [
      {
        name: "High-Value Customers",
        description: "Frequent purchasers with high order values",
        userCount: 2450,
        avgOrderValue: 156.78,
        engagementScore: 87,
      },
      {
        name: "Fashion Enthusiasts",
        description: "Users interested in latest trends and styles",
        userCount: 5678,
        avgOrderValue: 89.45,
        engagementScore: 76,
      },
      {
        name: "Budget Shoppers",
        description: "Price-conscious customers seeking deals",
        userCount: 8901,
        avgOrderValue: 42.33,
        engagementScore: 62,
      },
      {
        name: "Occasional Buyers",
        description: "Infrequent but targeted purchases",
        userCount: 3456,
        avgOrderValue: 67.89,
        engagementScore: 45,
      },
    ];
  }

  async getRecommendationStats() {
    // Mock recommendation statistics - in production, this would aggregate real data
    return {
      dailyRecommendations: 45678,
      clickThroughRate: 14.2,
      revenueAttribution: 12450,
      userCoverage: 89,
    };
  }
}
