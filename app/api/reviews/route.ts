import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/server/logger";
import { ReviewService } from "@/lib/server/reviewService";
import { getServerSession } from "next-auth";
import { authOptionsEnhanced } from "@/lib/server/authOptionsEnhanced";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          error: "Product ID required",
        },
        { status: 400 }
      );
    }

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortBy = searchParams.get("sortBy") || "newest";
    const verified = searchParams.get("verified") === "true" ? true : undefined;
    const minRating = searchParams.get("minRating")
      ? parseInt(searchParams.get("minRating")!)
      : undefined;

    const result = await ReviewService.getProductReviews(productId, {
      page,
      limit,
      sortBy,
      verified,
      minRating,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error("Error:", error);
    logger.error("Get reviews API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get reviews",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptionsEnhanced);

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { productId, rating, title, content, images, videos } = body;

    if (!productId || !rating || !content) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: productId, rating, content",
        },
        { status: 400 }
      );
    }

    const mockUserId = session.user.email || "user_123";
    const result = await ReviewService.createReview({
      productId,
      userId: mockUserId,
      rating,
      title,
      content,
      images: images || [],
      videos: videos || [],
      isVerified: false, // Would check if user purchased the product
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.review,
    });
  } catch (error) {
    logger.error("Error:", error);
    logger.error("Create review API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create review",
      },
      { status: 500 }
    );
  }
}
