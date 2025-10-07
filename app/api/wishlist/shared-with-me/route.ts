import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/server/authOptions";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Mock data for wishlists shared with the current user
    const mockSharedWishlists = [
      {
        id: "shared-wishlist-1",
        name: "Emma's Wedding Registry",
        description: "Help us celebrate our special day!",
        isPublic: true,
        shareCode: "emma-wedding-2024",
        createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
        itemCount: 28,
        owner: {
          id: "user-emma",
          name: "Emma Johnson",
        },
      },
      {
        id: "shared-wishlist-2",
        name: "Baby Shower List",
        description: "Items for our new arrival",
        isPublic: false,
        shareCode: "baby-shower-abc",
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        itemCount: 15,
        owner: {
          id: "user-sarah",
          name: "Sarah Williams",
        },
      },
    ];

    return NextResponse.json({ wishlists: mockSharedWishlists });
  } catch (error) {
    console.error("Error fetching shared wishlists:", error);
    return NextResponse.json(
      { error: "Failed to fetch shared wishlists" },
      { status: 500 }
    );
  }
}
