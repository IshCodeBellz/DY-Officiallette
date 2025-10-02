import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { withRequest } from "@/lib/server/logger";
import { OrderStatus, PaymentStatus } from "@/lib/status";
import {
  captureError,
  createErrorResponse,
  trackPerformance,
} from "@/lib/server/errors";

// GET /api/metrics - System health and business metrics endpoint
export const GET = withRequest(async function GET(req: NextRequest) {
  const start = Date.now();
  const perf = trackPerformance("metrics_endpoint", { route: "/api/metrics" });

  try {
    // Parallel queries for efficiency
    const [
      orderStats,
      paymentStats,
      productStats,
      userStats,
      recentActivity,
      systemHealth,
    ] = await Promise.all([
      // Order metrics by status
      prisma.order.groupBy({
        by: ["status"],
        _count: { _all: true },
        _sum: { totalCents: true, subtotalCents: true },
      }),

      // Payment metrics by status
      prisma.paymentRecord.groupBy({
        by: ["status"],
        _count: { _all: true },
        _sum: { amountCents: true },
      }),

      // Product & inventory stats
      prisma.$queryRaw`
        SELECT 
          COUNT(*) as total_products,
          COUNT(DISTINCT "brandId") as unique_brands,
          SUM(CASE WHEN sv.stock > 0 THEN 1 ELSE 0 END) as in_stock_variants,
          SUM(CASE WHEN sv.stock = 0 THEN 1 ELSE 0 END) as out_of_stock_variants,
          AVG(p.price) as avg_price
        FROM "Product" p
        LEFT JOIN "SizeVariant" sv ON p.id = sv."productId"
      `,

      // User & cart activity
      prisma.$queryRaw`
        SELECT 
          COUNT(DISTINCT u.id) as total_users,
          COUNT(DISTINCT c.id) as active_carts,
          COUNT(DISTINCT cl.id) as total_cart_lines,
          AVG(c."updatedAt"::date - c."createdAt"::date) as avg_cart_age_days
        FROM "User" u
        LEFT JOIN "Cart" c ON u.id = c."userId"
        LEFT JOIN "CartLine" cl ON c.id = cl."cartId"
      `,

      // Recent activity (last 24h)
      prisma.$queryRaw`
        SELECT 
          COUNT(CASE WHEN o."createdAt" > NOW() - INTERVAL '24 hours' THEN 1 END) as orders_24h,
          COUNT(CASE WHEN o."createdAt" > NOW() - INTERVAL '7 days' THEN 1 END) as orders_7d,
          COUNT(CASE WHEN u."createdAt" > NOW() - INTERVAL '24 hours' THEN 1 END) as signups_24h,
          COUNT(CASE WHEN pm."createdAt" > NOW() - INTERVAL '24 hours' THEN 1 END) as metrics_24h
        FROM "Order" o
        CROSS JOIN "User" u  
        CROSS JOIN "ProductMetrics" pm
      `,

      // System health checks
      (async () => {
        const dbStart = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        const dbLatency = Date.now() - dbStart;

        return {
          database: {
            status:
              dbLatency < 100
                ? "healthy"
                : dbLatency < 500
                ? "degraded"
                : "critical",
            latency_ms: dbLatency,
            connection_pool: "active", // Could expand with actual pool stats
          },
          timestamp: new Date().toISOString(),
          uptime_ms: process.uptime() * 1000,
        };
      })(),
    ]);

    // Transform order stats into status breakdown
    const orderMetrics = Object.values(OrderStatus).reduce((acc, status) => {
      const stat = orderStats.find((s) => s.status === status);
      acc[status.toLowerCase()] = {
        count: stat?._count?._all || 0,
        total_value: stat?._sum?.totalCents || 0,
      };
      return acc;
    }, {} as Record<string, { count: number; total_value: number }>);

    // Transform payment stats
    const paymentMetrics = Object.values(PaymentStatus).reduce(
      (acc, status) => {
        const stat = paymentStats.find((s) => s.status === status);
        acc[status.toLowerCase()] = {
          count: stat?._count?._all || 0,
          total_amount: stat?._sum?.amountCents || 0,
        };
        return acc;
      },
      {} as Record<string, { count: number; total_amount: number }>
    );

    const response = {
      timestamp: new Date().toISOString(),
      request_duration_ms: Date.now() - start,
      system: systemHealth,
      business: {
        orders: {
          by_status: orderMetrics,
          total_count: orderStats.reduce(
            (sum, s) => sum + (s._count?._all || 0),
            0
          ),
          total_value: orderStats.reduce(
            (sum, s) => sum + (s._sum?.totalCents || 0),
            0
          ),
        },
        payments: {
          by_status: paymentMetrics,
          total_transactions: paymentStats.reduce(
            (sum, s) => sum + (s._count?._all || 0),
            0
          ),
          total_processed: paymentStats.reduce(
            (sum, s) => sum + (s._sum?.amountCents || 0),
            0
          ),
        },
        products:
          Array.isArray(productStats) && productStats[0]
            ? {
                total_products: Number(productStats[0].total_products) || 0,
                unique_brands: Number(productStats[0].unique_brands) || 0,
                in_stock_variants:
                  Number(productStats[0].in_stock_variants) || 0,
                out_of_stock_variants:
                  Number(productStats[0].out_of_stock_variants) || 0,
                avg_price: Number(productStats[0].avg_price) || 0,
              }
            : null,
        users:
          Array.isArray(userStats) && userStats[0]
            ? {
                total_users: Number(userStats[0].total_users) || 0,
                active_carts: Number(userStats[0].active_carts) || 0,
                total_cart_lines: Number(userStats[0].total_cart_lines) || 0,
                avg_cart_age_days: Number(userStats[0].avg_cart_age_days) || 0,
              }
            : null,
        activity:
          Array.isArray(recentActivity) && recentActivity[0]
            ? {
                orders_last_24h: Number(recentActivity[0].orders_24h) || 0,
                orders_last_7d: Number(recentActivity[0].orders_7d) || 0,
                signups_last_24h: Number(recentActivity[0].signups_24h) || 0,
                product_views_last_24h:
                  Number(recentActivity[0].metrics_24h) || 0,
              }
            : null,
      },
    };

    perf.finish("ok");
    return NextResponse.json(response);
  } catch (error) {
    perf.finish("error");

    return createErrorResponse(
      error instanceof Error ? error : new Error("Metrics endpoint failed"),
      { route: "/api/metrics", operation: "get_metrics" }
    );
  }
});
