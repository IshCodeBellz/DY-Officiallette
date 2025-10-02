import { prisma } from "./prisma";

export interface CreateReviewData {
  productId: string;
  userId: string;
  rating: number; // 1-5
  title?: string;
  content: string;
  images?: string[];
  videos?: string[];
  isVerified?: boolean;
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
 * Enhanced Review Management Service with Real Database Integration
 */
export class ReviewService {
  /**
   * Admin interface methods
   */
  async getPendingModerationReviews() {
    try {
      const pendingReviews = await prisma.productReview.findMany({
        where: {
          isPublished: false,
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      });

      // Get product names separately since there's no direct relation
      const productIds = [...new Set(pendingReviews.map((r) => r.productId))];
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, sku: true },
      });

      const productMap = new Map(products.map((p) => [p.id, p]));

      return pendingReviews.map((review) => {
        const product = productMap.get(review.productId);
        return {
          comment: review.content,
          productName: product?.name || "Unknown Product",
          productSku: product?.sku || "N/A",
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
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      return reportedReviews.map((review) => ({
        content: review.content,
        authorName: review.authorName,
        type: "review",
        reportCount: Math.max(1, review.totalVotes - review.helpfulVotes),
        reasons:
          review.totalVotes > review.helpfulVotes
            ? ["Unhelpful", "Spam"]
            : ["Inappropriate"],
        status: review.isPublished ? "pending" : "resolved",
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

      const reviewEngagement =
        totalReviews > 0
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
