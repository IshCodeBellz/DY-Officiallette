import { prisma } from "./prisma";
import type { Prisma, ProductReview } from "@prisma/client";

export class ReviewService {
  // Admin page instance methods (mocked)
  async getPendingModerationReviews(): Promise<
    Array<{
      id: string;
      comment: string;
      productName: string;
      productSku?: string;
      userName: string;
      rating: number;
      hasPhotos: boolean;
      hasVideos: boolean;
      verified: boolean;
      createdAt: string;
    }>
  > {
    return [
      {
        id: "rev_1",
        comment: "Great fit, but color slightly off",
        productName: "Classic Tee",
        productSku: "TEE-CL-001",
        userName: "Jane D.",
        rating: 4,
        hasPhotos: true,
        hasVideos: false,
        verified: true,
        createdAt: new Date().toISOString(),
      },
    ];
  }

  async getReportedContent(): Promise<
    Array<{
      id: string;
      content: string;
      type: string;
      reportCount: number;
      reasons: string[];
      status: "pending" | "resolved" | "removed";
      authorName: string;
    }>
  > {
    return [
      {
        id: "rep_1",
        content: "Inappropriate language in review",
        type: "review",
        reportCount: 3,
        reasons: ["abusive", "spam"],
        status: "pending",
        authorName: "User123",
      },
    ];
  }

  async getSocialStats(): Promise<{
    pendingReviews: number;
    reportedContent: number;
    publicWishlists: number;
    reviewEngagement: number;
  }> {
    return {
      pendingReviews: 7,
      reportedContent: 2,
      publicWishlists: 1542,
      reviewEngagement: 68,
    };
  }

  // API static methods
  static async getProductReviews(
    productId: string,
    options: {
      page?: number;
      limit?: number;
      sortBy?: string;
      verified?: boolean;
      minRating?: number;
    } = {}
  ): Promise<{
    reviews: Array<{
      id: string;
      userId: string;
      rating: number;
      title?: string;
      content: string;
      verified: boolean;
      createdAt: string;
    }>;
    totalCount: number;
    analytics: {
      averageRating: number;
      totalReviews: number;
      ratingDistribution: Record<string, number>;
      verifiedReviewsPercentage: number;
    };
  }> {
    const { page = 1, limit = 10, verified, minRating } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductReviewWhereInput = { productId };
    if (verified !== undefined) where.isVerified = verified;
    if (minRating !== undefined) where.rating = { gte: minRating };

    try {
      const [rows, total] = await Promise.all([
        prisma.productReview.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            userId: true,
            rating: true,
            title: true,
            content: true,
            isVerified: true,
            createdAt: true,
          },
        }),
        prisma.productReview.count({ where }),
      ]);

      const analytics = await this.getProductReviewAnalytics(productId);
      const reviews = rows.map((r) => ({
        id: r.id,
        userId: r.userId || "",
        rating: r.rating,
        title: r.title || undefined,
        content: r.content,
        verified: r.isVerified,
        createdAt: r.createdAt.toISOString(),
      }));

      return { reviews, totalCount: total, analytics };
    } catch {
      return {
        reviews: [],
        totalCount: 0,
        analytics: {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: {},
          verifiedReviewsPercentage: 0,
        },
      };
    }
  }

  static async createReview(data: {
    productId: string;
    userId: string;
    rating: number;
    title?: string;
    content: string;
    images?: string[];
    videos?: string[];
    isVerified?: boolean;
  }): Promise<{ success: boolean; error?: string; review?: ProductReview }> {
    try {
      const review = await prisma.productReview.create({
        data: {
          productId: data.productId,
          userId: data.userId,
          authorName: "Anonymous",
          rating: data.rating,
          title: data.title || null,
          content: data.content,
          isVerified: !!data.isVerified,
          images:
            data.images && data.images.length
              ? JSON.stringify(data.images)
              : null,
        },
      });

      return { success: true, review };
    } catch (e) {
      return { success: false, error: "Failed to create review" };
    }
  }

  static async voteReviewHelpful(
    reviewId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string; newVoteCount?: number }> {
    // For now, return a mocked increment
    return { success: true, newVoteCount: Math.floor(Math.random() * 50) + 1 };
  }

  static async reportReview(
    reviewId: string,
    userId: string,
    reason: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    // TODO: persist report to moderation queue / database
    console.log("reportReview", { reviewId, userId, reason });
    return { success: true, message: "Report submitted" };
  }

  static async getModerationQueue(
    limit = 50
  ): Promise<Array<{ id: string; rating: number; comment: string }>> {
    const rows = await prisma.productReview
      .findMany({ take: limit, orderBy: { createdAt: "desc" } })
      .catch(() => []);
    return (rows as ProductReview[]).map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.content,
    }));
  }

  static async approveReview(
    reviewId: string,
    adminId: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    // Placeholder: mark review as approved
    console.log("approveReview", { reviewId, adminId });
    return { success: true, message: "Review approved" };
  }

  static async rejectReview(
    reviewId: string,
    adminId: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    console.log("rejectReview", { reviewId, adminId });
    return { success: true, message: "Review rejected" };
  }

  static async deleteReview(
    reviewId: string,
    adminId: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      await prisma.productReview.delete({ where: { id: reviewId } });
      return { success: true, message: "Review deleted" };
    } catch {
      return { success: false, error: "Failed to delete review" };
    }
  }

  static async getProductReviewAnalytics(productId: string): Promise<{
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Record<string, number>;
    verifiedReviewsPercentage: number;
  }> {
    try {
      const rows = await prisma.productReview.findMany({
        where: { productId },
        select: { rating: true, isVerified: true },
      });
      const total = rows.length;
      const avg = total
        ? (rows as Array<Pick<ProductReview, "rating" | "isVerified">>).reduce(
            (s, r) => s + r.rating,
            0
          ) / total
        : 0;
      const dist: Record<string, number> = {
        "1": 0,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
      };
      (rows as Array<Pick<ProductReview, "rating" | "isVerified">>).forEach(
        (r) => {
          const key = String(r.rating) as keyof typeof dist;
          dist[key] = (dist[key] || 0) + 1;
        }
      );
      const verifiedCount = (
        rows as Array<Pick<ProductReview, "rating" | "isVerified">>
      ).filter((r) => r.isVerified).length;
      return {
        averageRating: Math.round(avg * 10) / 10,
        totalReviews: total,
        ratingDistribution: dist,
        verifiedReviewsPercentage: total
          ? Math.round((verifiedCount / total) * 1000) / 10
          : 0,
      };
    } catch {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: {},
        verifiedReviewsPercentage: 0,
      };
    }
  }
}
