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

    const report = await InventoryService.generateInventoryReport();

    return NextResponse.json({
      success: true,
      data: report,
    });
  } catch (error) {
      console.error("Error:", error);
    console.error("Get inventory report API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate inventory report",
      },
      { status: 500 }
    );
  }
}
