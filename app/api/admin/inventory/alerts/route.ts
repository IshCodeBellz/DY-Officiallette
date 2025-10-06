import { NextRequest, NextResponse } from "next/server";
import { InventoryService } from "@/lib/server/inventoryService";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/server/authOptions";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Mock admin check
    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Admin access required",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    const alerts = await InventoryService.getLowStockAlerts(limit);

    return NextResponse.json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    console.error("Get inventory alerts API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get inventory alerts",
      },
      { status: 500 }
    );
  }
}
