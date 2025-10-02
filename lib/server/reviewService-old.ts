DELETE_FILE
}

export interface ReviewWithUser {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title?: string;
  content: string;
  images: string[];
  videos: string[];
  isVerified: boolean;
  helpfulVotes: number;
  reportCount: number;
  isModerated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewAnalytics {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<string, number>; // "5": 45, "4": 32, etc.
  verifiedReviewsPercentage: number;
  reviewsWithMedia: number;
  recentReviewsTrend: "increasing" | "decreasing" | "stable";
}

export interface ReviewModerationQueue {
  id: string;
  productId: string;
  userId: string;
  content: string;
  flagReason: string;
  reportCount: number;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
}

/**
 * Enhanced Review Management Service for Phase 4
 */
export class ReviewService {
  /**
   * Create a new product review
   */
  static async createReview(
    data: CreateReviewData
  ): Promise<{ success: boolean; review?: ReviewWithUser; error?: string }> {
    try {
      // Validate rating
      if (data.rating < 1 || data.rating > 5) {
        return { success: false, error: "Rating must be between 1 and 5" };
      }

      // Validate content length
      if (data.content.length < 10) {
        return {
          success: false,
          error: "Review content must be at least 10 characters",
        };
      }

      if (data.content.length > 2000) {
        return {
          success: false,
          error: "Review content must be less than 2000 characters",
        };
      }

      // Check if user has already reviewed this product
      const existingReview = await this.getUserReviewForProduct(
        data.userId,
        data.productId
      );
      if (existingReview) {
        return {
          success: false,
          error: "You have already reviewed this product",
        };
      }

      // Mock review creation since Prisma models not fully synced
      const mockReview: ReviewWithUser = {
        id: `review_${Date.now()}`,
        productId: data.productId,
        userId: data.userId,
        userName: "John Doe", // Would fetch from user
        userAvatar: "/avatars/default.jpg",
        rating: data.rating,
        title: data.title,
        content: data.content,
        images: data.images || [],
        videos: data.videos || [],
        isVerified: data.isVerified || false,
        helpfulVotes: 0,
        reportCount: 0,
        isModerated: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Auto-moderate if contains potentially harmful content
      if (this.containsInappropriateContent(data.content)) {
        mockReview.isModerated = true;
        await this.addToModerationQueue(mockReview, "inappropriate_content");
      }

      console.log("Review created:", mockReview);

      // Update product rating average
      await this.updateProductRatingAverage(data.productId);

      return { success: true, review: mockReview };
    } catch (error) {
      console.error("Create review error:", error);
      return { success: false, error: "Failed to create review" };
    }
  }

  /**
   * Get reviews for a product with pagination
   */
  static async getProductReviews(
    productId: string,
    options: {
      page?: number;
      limit?: number;
      sortBy?: "newest" | "oldest" | "rating_high" | "rating_low" | "helpful";
      verified?: boolean;
      minRating?: number;
    } = {}
  ): Promise<{
    reviews: ReviewWithUser[];
    totalCount: number;
    analytics: ReviewAnalytics;
  }> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = "newest",
        verified,
        minRating,
      } = options;

      // Mock reviews data
      const mockReviews: ReviewWithUser[] = [
        {
          id: "review_1",
          productId,
          userId: "user_1",
          userName: "Sarah Johnson",
          userAvatar: "/avatars/sarah.jpg",
          rating: 5,
          title: "Amazing quality!",
          content:
            "Absolutely love this product. The quality is outstanding and it arrived exactly as described. Would definitely recommend!",
          images: ["/reviews/product1_review1.jpg"],
          videos: [],
          isVerified: true,
          helpfulVotes: 23,
          reportCount: 0,
          isModerated: false,
          createdAt: new Date(Date.now() - 86400000), // 1 day ago
          updatedAt: new Date(Date.now() - 86400000),
        },
        {
          id: "review_2",
          productId,
          userId: "user_2",
          userName: "Mike Chen",
          userAvatar: "/avatars/mike.jpg",
          rating: 4,
          title: "Good value for money",
          content:
            "Decent product for the price. Shipping was fast and packaging was good. Minor quality issues but overall satisfied.",
          images: [],
          videos: [],
          isVerified: true,
          helpfulVotes: 15,
          reportCount: 0,
          isModerated: false,
          createdAt: new Date(Date.now() - 172800000), // 2 days ago
          updatedAt: new Date(Date.now() - 172800000),
        },
        {
          id: "review_3",
          productId,
          userId: "user_3",
          userName: "Emma Wilson",
          userAvatar: "/avatars/emma.jpg",
          rating: 3,
          title: "It's okay",
          content:
            "Product is fine but not exceptional. The size runs a bit small so order one size up. Delivery was on time.",
          images: [],
          videos: [],
          isVerified: false,
          helpfulVotes: 7,
          reportCount: 0,
          isModerated: false,
          createdAt: new Date(Date.now() - 259200000), // 3 days ago
          updatedAt: new Date(Date.now() - 259200000),
        },
      ];

      // Apply filters
      let filteredReviews = mockReviews;

      if (verified !== undefined) {
        filteredReviews = filteredReviews.filter(
          (r) => r.isVerified === verified
        );
      }

      if (minRating !== undefined) {
        filteredReviews = filteredReviews.filter((r) => r.rating >= minRating);
      }

      // Apply sorting
      filteredReviews = this.sortReviews(filteredReviews, sortBy);

      // Apply pagination
      const offset = (page - 1) * limit;
      const paginatedReviews = filteredReviews.slice(offset, offset + limit);

      // Generate analytics
      const analytics = this.generateReviewAnalytics(mockReviews);

      return {
        reviews: paginatedReviews,
        totalCount: filteredReviews.length,
        analytics,
      };
    } catch (error) {
      console.error("Get product reviews error:", error);
      return {
        reviews: [],
        totalCount: 0,
        analytics: this.getEmptyAnalytics(),
      };
    }
  }

  /**
   * Vote a review as helpful
   */
  static async voteReviewHelpful(
    reviewId: string,
    userId: string
  ): Promise<{ success: boolean; newVoteCount?: number; error?: string }> {
    try {
      // Check if user has already voted
      const hasVoted = await this.hasUserVotedOnReview(userId, reviewId);
      if (hasVoted) {
        return {
          success: false,
          error: "You have already voted on this review",
        };
      }

      // Mock vote increment
      const newVoteCount = Math.floor(Math.random() * 50) + 1;

      console.log("Review voted helpful:", { reviewId, userId, newVoteCount });
      return { success: true, newVoteCount };
    } catch (error) {
      console.error("Vote review helpful error:", error);
      return { success: false, error: "Failed to vote on review" };
    }
  }

  /**
   * Report a review for inappropriate content
   */
  static async reportReview(
    reviewId: string,
    userId: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate reason
      const validReasons = [
        "inappropriate_content",
        "spam",
        "fake_review",
        "offensive_language",
        "misleading_information",
      ];

      if (!validReasons.includes(reason)) {
        return { success: false, error: "Invalid report reason" };
      }

      // Check if user has already reported this review
      const hasReported = await this.hasUserReportedReview(userId, reviewId);
      if (hasReported) {
        return {
          success: false,
          error: "You have already reported this review",
        };
      }

      // Mock report handling
      console.log("Review reported:", { reviewId, userId, reason });

      // Add to moderation queue if multiple reports
      const reportCount = Math.floor(Math.random() * 5) + 1;
      if (reportCount >= 3) {
        console.log("Review added to moderation queue due to multiple reports");
      }

      return { success: true };
    } catch (error) {
      console.error("Report review error:", error);
      return { success: false, error: "Failed to report review" };
    }
  }

  /**
   * Get user's review for a specific product
   */
  static async getUserReviewForProduct(
    userId: string,
    productId: string
  ): Promise<ReviewWithUser | null> {
    try {
      // Mock user review check
      if (userId === "existing_user" && productId === "prod_1") {
        return {
          id: "existing_review_1",
          productId,
          userId,
          userName: "Existing User",
          rating: 4,
          content: "My existing review for this product",
          images: [],
          videos: [],
          isVerified: true,
          helpfulVotes: 5,
          reportCount: 0,
          isModerated: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }

      return null;
    } catch (error) {
      console.error("Get user review error:", error);
      return null;
    }
  }

    /**
   * Admin interface methods for social commerce
   */
  async getPendingModerationReviews() {
    try {
      const pendingReviews = await prisma.productReview.findMany({
        where: {
          isPublished: false,
        },
        include: {
          product: true,
          user: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      return pendingReviews.map(review => ({
        comment: review.content,
        productName: review.product?.name || 'Unknown Product',
        productSku: review.product?.sku || 'N/A',
        userName: review.authorName,
        verified: review.isVerified,
        rating: review.rating,
        hasPhotos: !!review.images,
        hasVideos: false, // Not implemented yet
        createdAt: review.createdAt,
      }));
    } catch (error) {
      console.error("Get pending reviews error:", error);
      return [];
    }
  }

  async getReportedContent() {
    try {
      // Get reviews with low helpful vote ratios (potential spam/inappropriate content)
      const reportedReviews = await prisma.productReview.findMany({
        where: {
          OR: [
            { isPublished: false },
            { totalVotes: { gt: 5 }, helpfulVotes: { lt: 2 } }, // Low helpful ratio
          ],
        },
        include: {
          product: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      return reportedReviews.map(review => ({
        content: review.content,
        authorName: review.authorName,
        type: 'review',
        reportCount: Math.max(1, review.totalVotes - review.helpfulVotes),
        reasons: review.totalVotes > review.helpfulVotes ? ['Unhelpful', 'Spam'] : ['Inappropriate'],
        status: review.isPublished ? 'pending' : 'resolved',
      }));
    } catch (error) {
      console.error("Get reported content error:", error);
      return [];
    }
  }

  async getSocialStats() {
    try {
      const [
        pendingReviews,
        reportedContent,
        totalReviews,
        helpfulReviews,
        publicWishlists,
      ] = await Promise.all([
        prisma.productReview.count({
          where: { isPublished: false },
        }),
        prisma.productReview.count({
          where: {
            totalVotes: { gt: 5 },
            helpfulVotes: { lt: 2 },
          },
        }),
        prisma.productReview.count(),
        prisma.productReview.count({
          where: {
            totalVotes: { gt: 0 },
            helpfulVotes: { gt: 0 },
          },
        }),
        prisma.wishlist.count({
          where: { isPublic: true },
        }),
      ]);

      const reviewEngagement = totalReviews > 0 
        ? Math.round((helpfulReviews / totalReviews) * 100)
        : 0;

      return {
        pendingReviews,
        reportedContent,
        publicWishlists,
        reviewEngagement,
      };
    } catch (error) {
      console.error("Get social stats error:", error);
      return {
        pendingReviews: 0,
        reportedContent: 0,
        publicWishlists: 0,
        reviewEngagement: 0,
      };
    }
  }

  /**
   * Private helper methods
   */
  private static sortReviews(
    reviews: ReviewWithUser[],
    sortBy: string
  ): ReviewWithUser[] {
    switch (sortBy) {
      case "newest":
        return reviews.sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
        );
      case "oldest":
        return reviews.sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
        );
      case "rating_high":
        return reviews.sort((a, b) => b.rating - a.rating);
      case "rating_low":
        return reviews.sort((a, b) => a.rating - b.rating);
      case "helpful":
        return reviews.sort((a, b) => b.helpfulVotes - a.helpfulVotes);
      default:
        return reviews;
    }
  }

  private static generateReviewAnalytics(
    reviews: ReviewWithUser[]
  ): ReviewAnalytics {
    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

    const ratingDistribution: Record<string, number> = {};
    for (let i = 1; i <= 5; i++) {
      ratingDistribution[i.toString()] = reviews.filter(
        (r) => r.rating === i
      ).length;
    }

    const verifiedReviews = reviews.filter((r) => r.isVerified).length;
    const verifiedReviewsPercentage =
      totalReviews > 0 ? (verifiedReviews / totalReviews) * 100 : 0;

    const reviewsWithMedia = reviews.filter(
      (r) => r.images.length > 0 || r.videos.length > 0
    ).length;

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
      ratingDistribution,
      verifiedReviewsPercentage:
        Math.round(verifiedReviewsPercentage * 10) / 10,
      reviewsWithMedia,
      recentReviewsTrend: "increasing", // Would calculate based on date analysis
    };
  }

  private static getEmptyAnalytics(): ReviewAnalytics {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
      verifiedReviewsPercentage: 0,
      reviewsWithMedia: 0,
      recentReviewsTrend: "stable",
    };
  }

  private static containsInappropriateContent(content: string): boolean {
    const inappropriateWords = ["scam", "fraud", "terrible", "hate", "worst"];
    const lowerContent = content.toLowerCase();
    return inappropriateWords.some((word) => lowerContent.includes(word));
  }

  private static async addToModerationQueue(
    review: ReviewWithUser,
    reason: string
  ): Promise<void> {
    console.log("Added to moderation queue:", { reviewId: review.id, reason });
  }

  private static async updateProductRatingAverage(
    productId: string
  ): Promise<void> {
    console.log("Updated product rating average for:", productId);
  }

  private static async hasUserVotedOnReview(
    userId: string,
    reviewId: string
  ): Promise<boolean> {
    // Mock vote check
    return userId === "voted_user" && reviewId === "review_1";
  }

  private static async hasUserReportedReview(
    userId: string,
    reviewId: string
  ): Promise<boolean> {
    // Mock report check
    return userId === "reporter_user" && reviewId === "review_1";
  }

  /**
   * Admin interface methods
   */
  async getPendingModerationReviews() {
    try {
      const pendingReviews = await prisma.productReview.findMany({
        where: {
          isPublished: false,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      // Get product names separately since there's no direct relation
      const productIds = [...new Set(pendingReviews.map(r => r.productId))];
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, sku: true },
      });

      const productMap = new Map(products.map(p => [p.id, p]));

      return pendingReviews.map(review => {
        const product = productMap.get(review.productId);
        return {
          comment: review.content,
          productName: product?.name || 'Unknown Product',
          productSku: product?.sku || 'N/A',
          userName: review.authorName,
          verified: review.isVerified,
          rating: review.rating,
          hasPhotos: !!review.images,
          hasVideos: false, // Not implemented yet
          createdAt: review.createdAt,
        };
      });
    } catch (error) {
      console.error("Get pending reviews error:", error);
      return [];
    }
  }

  async getReportedContent() {
    try {
      // Get reviews with low helpful vote ratios (potential spam/inappropriate content)
      const reportedReviews = await prisma.productReview.findMany({
        where: {
          OR: [
            { isPublished: false },
            { totalVotes: { gt: 5 }, helpfulVotes: { lt: 2 } }, // Low helpful ratio
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      return reportedReviews.map(review => ({
        content: review.content,
        authorName: review.authorName,
        type: 'review',
        reportCount: Math.max(1, review.totalVotes - review.helpfulVotes),
        reasons: review.totalVotes > review.helpfulVotes ? ['Unhelpful', 'Spam'] : ['Inappropriate'],
        status: review.isPublished ? 'pending' : 'resolved',
      }));
    } catch (error) {
      console.error("Get reported content error:", error);
      return [];
    }
  }

  async getSocialStats() {
    try {
      const [
        pendingReviews,
        reportedContent,
        totalReviews,
        helpfulReviews,
        publicWishlists,
      ] = await Promise.all([
        prisma.productReview.count({
          where: { isPublished: false },
        }),
        prisma.productReview.count({
          where: {
            totalVotes: { gt: 5 },
            helpfulVotes: { lt: 2 },
          },
        }),
        prisma.productReview.count(),
        prisma.productReview.count({
          where: {
            totalVotes: { gt: 0 },
            helpfulVotes: { gt: 0 },
          },
        }),
        prisma.wishlist.count({
          where: { isPublic: true },
        }),
      ]);

      const reviewEngagement = totalReviews > 0 
        ? Math.round((helpfulReviews / totalReviews) * 100)
        : 0;

      return {
        pendingReviews,
        reportedContent,
        publicWishlists,
        reviewEngagement,
      };
    } catch (error) {
      console.error("Get social stats error:", error);
      return {
        pendingReviews: 0,
        reportedContent: 0,
        publicWishlists: 0,
        reviewEngagement: 0,
      };
    }
  }
}
      {
        comment: "Not worth the money. Material feels cheap and sizing is off.",
        productName: "Slim Fit Jeans",
        productSku: "SFJ-002",
        userName: "Mike Chen",
        verified: false,
        rating: 2,
        hasPhotos: false,
        hasVideos: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      },
      {
        comment:
          "Great sneakers for running! Comfortable and stylish. Highly recommend!",
        productName: "Running Sneakers",
        productSku: "RS-003",
        userName: "Alex Rivera",
        verified: true,
        rating: 4,
        hasPhotos: true,
        hasVideos: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
      },
    ];
  }

  async getReportedContent() {
    // Mock reported content - in production, this would query reports table
    return [
      {
        content: "This is a scam! Don't buy from this store!",
        type: "review",
        authorName: "Anonymous User",
        reportCount: 5,
        reasons: ["Spam", "Inappropriate language"],
        status: "pending" as const,
      },
      {
        content: "Terrible customer service, they stole my money",
        type: "review",
        authorName: "Angry Customer",
        reportCount: 3,
        reasons: ["False information", "Defamatory"],
        status: "pending" as const,
      },
      {
        content: "Check out my personal store instead: example.com",
        type: "review",
        authorName: "Competitor",
        reportCount: 8,
        reasons: ["Spam", "Promotion"],
        status: "resolved" as const,
      },
    ];
  }

  async getSocialStats() {
    // Mock social commerce statistics
    return {
      pendingReviews: 12,
      reportedContent: 5,
      publicWishlists: 3456,
      reviewEngagement: 78,
    };
  }
}
