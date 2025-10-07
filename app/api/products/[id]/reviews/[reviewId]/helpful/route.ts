import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/server/authOptions";

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; reviewId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { helpful } = body;

    // For now, return mock success
    // This will be implemented once the database is properly configured
    return NextResponse.json({
      success: true,
      message:
        "Helpful vote functionality will be enabled once database is configured",
    });
  } catch (error) {
      console.error("Error:", error);
    console.error("Error marking review as helpful:", error);
    return NextResponse.json(
      { error: "Failed to mark review as helpful" },
      { status: 500 }
    );
  }
}
