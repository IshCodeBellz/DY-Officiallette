import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/server/authOptions";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    // Since we don't have a sessions table yet, return mock data
    const mockSessions = [
      {
        id: "current",
        name: "Current Session",
        type: "desktop" as const,
        browser: "Chrome 120.0",
        os: "macOS",
        location: "San Francisco, CA",
        ipAddress: "192.168.1.100",
        lastActive: new Date(),
        isCurrent: true,
        isActive: true,
        riskScore: 15,
        firstSeen: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      },
      {
        id: "mobile-1",
        name: "iPhone 15 Pro",
        type: "mobile" as const,
        browser: "Safari 17.1",
        os: "iOS 17.1",
        location: "San Francisco, CA",
        ipAddress: "192.168.1.101",
        lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        isCurrent: false,
        isActive: true,
        riskScore: 25,
        firstSeen: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      },
      {
        id: "laptop-1",
        name: "MacBook Pro",
        type: "desktop" as const,
        browser: "Firefox 119.0",
        os: "macOS",
        location: "New York, NY",
        ipAddress: "10.0.0.50",
        lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        isCurrent: false,
        isActive: false,
        riskScore: 65,
        firstSeen: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      },
    ];

    return NextResponse.json({ sessions: mockSessions });
  } catch (error) {
    console.error("Failed to get sessions:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 }
      );
    }

    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { message: "Session ID is required" },
        { status: 400 }
      );
    }

    // In a real implementation, you would delete the session from the database
    // For now, we'll just return success

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to terminate session:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
