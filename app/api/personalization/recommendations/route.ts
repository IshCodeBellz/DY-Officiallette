import { NextRequest, NextResponse } from "next/server";
import { PersonalizationService } from "@/lib/server/personalizationService";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/server/authOptions";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "12"), 50);
    const strategy = (searchParams.get("strategy") as any) || "hybrid";
    const categoryId = searchParams.get("categoryId") || undefined;
    const excludeIds =
      searchParams.get("exclude")?.split(",").filter(Boolean) || [];

    // Mock user ID since session.user.id not available
    const mockUserId = session.user.email || "user_123";

    const recommendations =
      await PersonalizationService.getPersonalizedRecommendations(mockUserId, {
        limit,
        strategy,
        categoryId,
        excludeProductIds: excludeIds,
      });

    return NextResponse.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    console.error("Recommendations API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get recommendations",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

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
    const { productId, interactionType } = body;

    if (!productId || !interactionType) {
      return NextResponse.json(
        {
          success: false,
          error: "Product ID and interaction type required",
        },
        { status: 400 }
      );
    }

    const validInteractions = [
      "view",
      "cart_add",
      "wishlist_add",
      "purchase",
      "search",
    ];
    if (!validInteractions.includes(interactionType)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid interaction type",
        },
        { status: 400 }
      );
    }

    // Mock user ID since session.user.id not available
    const mockUserId = session.user.email || "user_123";

    await PersonalizationService.trackUserInteraction(
      mockUserId,
      productId,
      interactionType
    );

    return NextResponse.json({
      success: true,
      message: "Interaction tracked successfully",
    });
  } catch (error) {
    console.error("Track interaction API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to track interaction",
      },
      { status: 500 }
    );
  }
}
