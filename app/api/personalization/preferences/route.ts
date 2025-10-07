import { NextRequest, NextResponse } from "next/server";
import { PersonalizationService } from "@/lib/server/personalizationService";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/server/authOptions";

export const dynamic = "force-dynamic";

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

    // Mock user ID since session.user.id not available
    const mockUserId = session.user.email || "user_123";

    const preferences = await PersonalizationService.getUserPreferences(
      mockUserId
    );

    return NextResponse.json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    console.error("User preferences API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get user preferences",
      },
      { status: 500 }
    );
  }
}
