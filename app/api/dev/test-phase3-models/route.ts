import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

export async function GET(request: NextRequest) {
  try {
    // Test if we can access our new Phase 3 models
    console.log("Testing Prisma client with Phase 3 models...");

    // Test ProductVariant model
    const variantCount = await prisma.productVariant.count();
    console.log("ProductVariant count:", variantCount);

    // Test UserBehavior model
    const behaviorCount = await prisma.userBehavior.count();
    console.log("UserBehavior count:", behaviorCount);

    // Test ProductBundle model
    const bundleCount = await prisma.productBundle.count();
    console.log("ProductBundle count:", bundleCount);

    // Test InventoryAlert model
    const alertCount = await prisma.inventoryAlert.count();
    console.log("InventoryAlert count:", alertCount);

    return NextResponse.json({
      success: true,
      data: {
        message: "Phase 3 models are working!",
        counts: {
          variants: variantCount,
          behaviors: behaviorCount,
          bundles: bundleCount,
          alerts: alertCount,
        },
      },
    });
  } catch (error) {
    console.error("Phase 3 model test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Phase 3 models not accessible",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
