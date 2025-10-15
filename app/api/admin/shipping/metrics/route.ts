import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/server/logger";
import { getServerSession } from "next-auth";
import { logger } from "@/lib/server/logger";
import { authOptionsEnhanced } from "@/lib/server/authOptionsEnhanced";
import { logger } from "@/lib/server/logger";
import { TrackingService } from "@/lib/server/shipping/TrackingService";
import { logger } from "@/lib/server/logger";
import { prisma } from "@/lib/server/prisma";
import { logger } from "@/lib/server/logger";

export async function GET(request: NextRequest) {
  // Check admin authentication
  const session = await getServerSession(authOptionsEnhanced);
  const isAdmin = (session?.user as { isAdmin: boolean })?.isAdmin;
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    // Get delivery metrics (with fallback if service unavailable)
    let metrics;
    try {
      metrics = await TrackingService.getDeliveryMetrics({
        from: fromDate,
        to: new Date(),
      });
    } catch (error) {
      logger.warn("TrackingService not available:", error);
      metrics = {
        totalShipments: 0,
        deliveredShipments: 0,
        deliveryRate: 0,
        avgDeliveryTimeHours: 0,
        onTimeDeliveryRate: 0,
        carrierPerformance: [],
      };
    }

    // Get shipment status breakdown (with fallback)
    let statusBreakdown = [];
    try {
      statusBreakdown = await prisma.shipment.groupBy({
        by: ["status"],
        _count: {
          status: true,
        },
        where: {
          createdAt: {
            gte: fromDate,
          },
        },
      });
    } catch (error) {
      logger.warn("Shipment status breakdown not available:", error);
      statusBreakdown = [];
    }

    // Get carrier volume (with fallback)
    let carrierVolume = [];
    try {
      carrierVolume = await prisma.shipment.groupBy({
        by: ["carrier"],
        _count: {
          carrier: true,
        },
        _sum: {
          cost: true,
        },
        where: {
          createdAt: {
            gte: fromDate,
          },
        },
      });
    } catch (error) {
      logger.warn("Carrier volume not available:", error);
      carrierVolume = [];
    }

    // Get daily shipment volume (with fallback)
    let dailyVolume = [];
    try {
      dailyVolume = await prisma.shipment.findMany({
        select: {
          createdAt: true,
          status: true,
        },
        where: {
          createdAt: {
            gte: fromDate,
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      });
    } catch (error) {
      logger.warn("Daily volume not available:", error);
      dailyVolume = [];
    }

    // Process daily volume data
    const dailyStats = dailyVolume.reduce((acc: Record<string, { date: string; shipped: number; delivered: number }>, shipment: { createdAt: Date; status: string }) => {
      const date = shipment.createdAt.toISOString().split("T")[0];
      if (!acc[date]) {
        acc[date] = { date, shipped: 0, delivered: 0 };
      }
      acc[date].shipped++;
      if (shipment.status === "DELIVERED") {
        acc[date].delivered++;
      }
      return acc;
    }, {});

    // Get recent issues (delayed or failed deliveries) (with fallback)
    let issues = [];
    try {
      issues = await prisma.shipment.findMany({
        where: {
          OR: [
            { status: "EXCEPTION" },
            { status: "DELIVERY_ATTEMPTED" },
            {
              AND: [
                { estimatedDelivery: { lt: new Date() } },
                { status: { notIn: ["DELIVERED", "CANCELLED"] } },
              ],
            },
          ],
        },
        include: {
          order: {
            select: {
              id: true,
              email: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      });
    } catch (error) {
      logger.warn("Issues query not available:", error);
      issues = [];
    }

    return NextResponse.json({
      summary: {
        totalShipments: metrics?.totalShipments || 0,
        deliveredShipments: metrics?.deliveredShipments || 0,
        deliveryRate: metrics?.deliveryRate || 0,
        avgDeliveryTimeHours: metrics?.avgDeliveryTimeHours || 0,
        onTimeDeliveryRate: metrics?.onTimeDeliveryRate || 0,
      },
      statusBreakdown: statusBreakdown.map((item: { status: string; _count: { status: number } }) => ({
        status: item.status,
        count: item._count.status,
      })),
      carrierPerformance: metrics?.carrierPerformance || [],
      carrierVolume: carrierVolume.map((item: { carrier: string; _count: { carrier: number }; _sum: { cost: number | null } }) => ({
        carrier: item.carrier,
        shipments: item._count.carrier,
        totalCost: item._sum.cost || 0,
      })),
      dailyVolume: Object.values(dailyStats),
      issues: issues.map((issue: { id: string; orderId: string; description: string; severity: string; createdAt: Date }) => ({
        id: issue.id,
        orderId: issue.orderId,
        trackingNumber: issue.trackingNumber,
        carrier: issue.carrier,
        status: issue.status,
        estimatedDelivery: issue.estimatedDelivery,
        createdAt: issue.createdAt,
        customer: {
          name:
            `${issue.order.user?.firstName || ""} ${
              issue.order.user?.lastName || ""
            }`.trim() || "Guest",
          email: issue.order.email,
        },
      })),
    });
  } catch (error) {
    logger.error("Error fetching shipping metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 }
    );
  }
}
