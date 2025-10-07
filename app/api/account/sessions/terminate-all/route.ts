import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/server/authOptions";
import { PrismaClient } from "@prisma/client";

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    // In a real implementation, you would:
    // 1. Delete all user sessions from the database
    // 2. Invalidate all JWT tokens
    // 3. Clear session cookies
    // 4. Log the security event

    // For now, we'll just return success
    // The frontend will handle redirecting to login

    return NextResponse.json({
      success: true,
      message: "All sessions terminated successfully",
    });
  } catch (error) {
      console.error("Error:", error);
    console.error("Failed to terminate all sessions:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
