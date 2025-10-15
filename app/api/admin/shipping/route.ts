import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/server/logger";
import { getServerSession } from "next-auth";
import { logger } from "@/lib/server/logger";
import { authOptionsEnhanced } from "@/lib/server/authOptionsEnhanced";
import { logger } from "@/lib/server/logger";
import { TrackingService } from "@/lib/server/shipping/TrackingService";
import { logger } from "@/lib/server/logger";
import { ShippingService } from "@/lib/server/shipping/ShippingService";
import { logger } from "@/lib/server/logger";
import { prisma } from "@/lib/server/prisma";
import { logger } from "@/lib/server/logger";

interface ShipmentRecord {
  id: string;
  orderId: string;
  trackingNumber: string;
  carrier: string;
  service: string;
  status: string;
  cost: number;
  estimatedDelivery?: Date | null;
  actualDelivery?: Date | null;
  createdAt: Date;
  lastTrackedAt?: Date | null;
  order?: {
    id: string;
    email: string;
    status: string;
    total: number;
    customerName: string;
    createdAt: Date;
  };
}

export async function GET(request: NextRequest) {
  // Check admin authentication
  const session = await getServerSession(authOptionsEnhanced);
  const isAdmin = (session?.user as { isAdmin: boolean })?.isAdmin;
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const carrier = searchParams.get("carrier");
    const search = searchParams.get("search");

    // Build where clause
    interface WhereClause {
      status?: string;
      carrier?: string;
      OR?: Array<{
        trackingNumber?: { contains: string; mode: string };
        order?: { 
          email?: { contains: string; mode: string };
          id?: { contains: string; mode: string };
        };
      }>;
    }
    
    const whereClause: WhereClause = {};

    if (status) {
      whereClause.status = status;
    }

    if (carrier) {
      whereClause.carrier = carrier;
    }

    if (search) {
      whereClause.OR = [
        { trackingNumber: { contains: search, mode: "insensitive" } },
        { order: { email: { contains: search, mode: "insensitive" } } },
        { order: { id: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Check if shipment table exists and get shipments with pagination
    let shipments = [];
    let total = 0;

    try {
      [shipments, total] = await Promise.all([
        prisma.shipment.findMany({
          where: whereClause,
          include: {
            order: {
              select: {
                id: true,
                email: true,
                status: true,
                totalCents: true,
                createdAt: true,
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
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.shipment.count({ where: whereClause }),
      ]);
    } catch (error) {
      logger.warn("Shipment table not available yet:", error);
      // Return empty data if shipment table doesn't exist
      shipments = [];
      total = 0;
    }

    return NextResponse.json({
      shipments: shipments.map((shipment: ShipmentRecord) => ({
        id: shipment.id,
        orderId: shipment.orderId,
        trackingNumber: shipment.trackingNumber,
        carrier: shipment.carrier,
        service: shipment.service,
        status: shipment.status,
        cost: shipment.cost,
        estimatedDelivery: shipment.estimatedDelivery,
        actualDelivery: shipment.actualDelivery,
        createdAt: shipment.createdAt,
        lastTrackedAt: shipment.lastTrackedAt,
        order: {
          id: shipment.order.id,
          email: shipment.order.email,
          status: shipment.order.status,
          total: shipment.order.totalCents / 100,
          customerName:
            `${shipment.order.user?.firstName || ""} ${
              shipment.order.user?.lastName || ""
            }`.trim() || "Guest",
          createdAt: shipment.order.createdAt,
        },
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("Error fetching shipments:", error);
    return NextResponse.json(
      { error: "Failed to fetch shipments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Check admin authentication
  const session = await getServerSession(authOptionsEnhanced);
  const isAdmin = (session?.user as { isAdmin: boolean })?.isAdmin;
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();

    switch (data.action) {
      case "refresh_tracking":
        await ShippingService.updateAllShipmentTracking();
        return NextResponse.json({ success: true });

      case "refresh_single":
        if (!data.trackingNumber) {
          return NextResponse.json(
            { error: "Tracking number required" },
            { status: 400 }
          );
        }

        const tracking = await TrackingService.getTrackingStatus(data.orderId);
        if (tracking) {
          // Force update from carrier
          await ShippingService.updateAllShipmentTracking();
        }

        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    logger.error("Error handling shipment action:", error);
    return NextResponse.json(
      { error: "Failed to process action" },
      { status: 500 }
    );
  }
}
