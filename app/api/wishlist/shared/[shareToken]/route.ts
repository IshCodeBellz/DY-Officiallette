import { NextRequest, NextResponse } from "next/server";
import { SocialWishlistService } from "@/lib/server/socialWishlistService";

export async function GET(
  request: NextRequest,
  { params }: { params: { shareToken: string } }
) {
  try {
    const wishlist = await SocialWishlistService.getPublicWishlist(
      params.shareToken
    );

    if (!wishlist) {
      return NextResponse.json(
        {
          success: false,
          error: "Wishlist not found or not public",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: wishlist,
    });
  } catch (error) {
      console.error("Error:", error);
    console.error("Get shared wishlist API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get shared wishlist",
      },
      { status: 500 }
    );
  }
}
