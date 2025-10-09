// Analytics Event Tracking Service - Collects and processes analytics data
import { prisma } from "@/lib/server/prisma";
import { Prisma } from "@prisma/client";

export interface EventData {
  userId?: string | null;
  sessionId?: string | null;
  eventType: string;
  eventCategory?: string;
  eventAction?: string;
  eventLabel?: string;
  eventValue?: number;
  productId?: string;
  categoryId?: string;
  metadata?: string;
  properties?: Record<string, any>;
  timestamp?: Date;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
}

export interface PageViewData {
  userId?: string | null;
  sessionId?: string | null;
  path: string;
  title?: string;
  referrer?: string;
  timeOnPage?: number;
  timestamp?: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface SessionData {
  userId?: string | null;
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  device?: string;
  browser?: string;
  os?: string;
  ipAddress?: string;
  country?: string;
  city?: string;
}

export class AnalyticsTracker {
  // Track analytics events
  static async trackEvent(data: EventData): Promise<void> {
    try {
      if (data.sessionId) {
        await prisma.analyticsEvent.create({
          data: {
            userId: data.userId || undefined,
            sessionId: data.sessionId,
            eventType: data.eventType,
            eventCategory: data.eventCategory || "general",
            eventAction: data.eventAction || "unknown",
            eventLabel: data.eventLabel || undefined,
            eventValue: data.eventValue || undefined,
            productId: data.productId || undefined,
            categoryId: data.categoryId || undefined,
            metadata: data.metadata || undefined,
          },
        });
      }

      // Update related analytics models based on event type
      await this.updateAnalyticsModels(data);
    } catch (error) {
      console.error("Error tracking event:", error);
      // Don't throw error to avoid breaking user experience
    }
  }

  // Track page views
  static async trackPageView(data: PageViewData): Promise<void> {
    try {
      if (data.sessionId) {
        await prisma.pageView.create({
          data: {
            userId: data.userId || undefined,
            sessionId: data.sessionId,
            path: data.path,
            title: data.title || undefined,
            referrer: data.referrer || undefined,
            duration: data.timeOnPage || undefined,
            timestamp: data.timestamp || new Date(),
          },
        });
      }

      // Track page view event
      await this.trackEvent({
        userId: data.userId,
        sessionId: data.sessionId,
        eventType: "PAGE_VIEW",
        properties: {
          path: data.path,
          title: data.title,
          timeOnPage: data.timeOnPage,
        },
        timestamp: data.timestamp,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        referrer: data.referrer,
      });
    } catch (error) {
      console.error("Error tracking page view:", error);
    }
  }

  // Track user sessions
  static async startSession(data: SessionData): Promise<void> {
    try {
      await prisma.userSession.upsert({
        where: { sessionToken: data.sessionId },
        update: {
          startTime: data.startTime,
          deviceType: data.device,
          browser: data.browser,
          ipAddress: data.ipAddress,
          country: data.country,
          city: data.city,
        },
        create: {
          userId: data.userId,
          sessionToken: data.sessionId,
          startTime: data.startTime,
          deviceType: data.device,
          browser: data.browser,
          ipAddress: data.ipAddress,
          country: data.country,
          city: data.city,
        },
      });
    } catch (error) {
      console.error("Error starting session:", error);
    }
  }

  // End user session
  static async endSession(
    sessionId: string,
    endTime: Date = new Date()
  ): Promise<void> {
    try {
      const session = await prisma.userSession.findUnique({
        where: { sessionToken: sessionId },
      });

      if (session) {
        const duration = Math.floor(
          (endTime.getTime() - session.startTime.getTime()) / 1000
        );

        await prisma.userSession.update({
          where: { sessionToken: sessionId },
          data: {
            endTime,
            duration,
          },
        });
      }
    } catch (error) {
      console.error("Error ending session:", error);
    }
  }

  // Track product views
  static async trackProductView(
    productId: string,
    data: EventData
  ): Promise<void> {
    try {
      // Track the event
      await this.trackEvent({
        ...data,
        eventType: "PRODUCT_VIEW",
        properties: {
          ...data.properties,
          productId,
        },
      });

      // Update product metrics
      await prisma.productMetrics.upsert({
        where: { productId },
        update: {
          views: { increment: 1 },
          updatedAt: new Date(),
        },
        create: {
          productId,
          views: 1,
          purchases: 0,
        },
      });

      // Update product analytics
      await this.updateProductAnalytics(productId);
    } catch (error) {
      console.error("Error tracking product view:", error);
    }
  }

  // Track product purchases
  static async trackProductPurchase(
    productId: string,
    data: EventData & { quantity: number; priceCents: number }
  ): Promise<void> {
    try {
      // Track the event
      await this.trackEvent({
        ...data,
        eventType: "PRODUCT_PURCHASE",
        properties: {
          ...data.properties,
          productId,
          quantity: data.quantity,
          priceCents: data.priceCents,
        },
      });

      // Update product metrics
      await prisma.productMetrics.upsert({
        where: { productId },
        update: {
          purchases: { increment: data.quantity },
          updatedAt: new Date(),
        },
        create: {
          productId,
          views: 0,
          purchases: data.quantity,
        },
      });

      // Update product analytics
      await this.updateProductAnalytics(productId);
    } catch (error) {
      console.error("Error tracking product purchase:", error);
    }
  }

  // Track search queries
  static async trackSearch(
    query: string,
    resultCount: number,
    data: EventData
  ): Promise<void> {
    try {
      await this.trackEvent({
        ...data,
        eventType: "SEARCH",
        properties: {
          ...data.properties,
          query,
          resultCount,
        },
      });

      // Update daily search analytics
      await this.updateSearchAnalytics(new Date(), query, resultCount);
    } catch (error) {
      console.error("Error tracking search:", error);
    }
  }

  // Track cart events
  static async trackCartEvent(
    eventType: "ADD_TO_CART" | "REMOVE_FROM_CART" | "CART_VIEW",
    productId: string,
    data: EventData
  ): Promise<void> {
    try {
      await this.trackEvent({
        ...data,
        eventType,
        properties: {
          ...data.properties,
          productId,
        },
      });

      // Update conversion funnel data
      await this.updateConversionFunnel(eventType, data.sessionId);
    } catch (error) {
      console.error("Error tracking cart event:", error);
    }
  }

  // Update analytics models based on events
  private static async updateAnalyticsModels(data: EventData): Promise<void> {
    try {
      // Update conversion funnel based on event type
      if (
        [
          "PAGE_VIEW",
          "PRODUCT_VIEW",
          "ADD_TO_CART",
          "CHECKOUT_START",
          "PURCHASE",
        ].includes(data.eventType)
      ) {
        await this.updateConversionFunnel(data.eventType, data.sessionId);
      }

      // Update category analytics for product-related events
      if (
        ["PRODUCT_VIEW", "PRODUCT_PURCHASE"].includes(data.eventType) &&
        data.properties?.productId
      ) {
        await this.updateCategoryAnalytics(data.properties.productId);
      }
    } catch (error) {
      console.error("Error updating analytics models:", error);
    }
  }

  // Update product analytics
  private static async updateProductAnalytics(
    productId: string
  ): Promise<void> {
    try {
      const metrics = await prisma.productMetrics.findUnique({
        where: { productId },
      });

      if (metrics) {
        const conversionRate =
          metrics.views > 0 ? (metrics.purchases / metrics.views) * 100 : 0;

        // Get revenue data
        const revenueData = await prisma.$queryRaw<Array<{ revenue: bigint }>>`
          SELECT COALESCE(SUM(oi."priceCents" * oi.quantity), 0) as revenue
          FROM "OrderItem" oi
          INNER JOIN "Order" o ON oi."orderId" = o.id
          WHERE oi."productId" = ${productId} AND o.status = 'COMPLETED'
        `;

        const revenue = Number(revenueData[0]?.revenue || 0);

        await prisma.productAnalytics.upsert({
          where: { productId },
          update: {
            viewCount: metrics.views,
            purchaseCount: metrics.purchases,
            conversionRate,
            updatedAt: new Date(),
          },
          create: {
            productId,
            viewCount: metrics.views,
            purchaseCount: metrics.purchases,
            conversionRate,
          },
        });
      }
    } catch (error) {
      console.error("Error updating product analytics:", error);
    }
  }

  // Update category analytics
  private static async updateCategoryAnalytics(
    productId: string
  ): Promise<void> {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { categoryId: true },
      });

      if (product?.categoryId) {
        // Get category metrics
        const categoryData = await prisma.$queryRaw<
          Array<{
            total_revenue: bigint;
            product_views: bigint;
            total_orders: bigint;
            avg_order_value: number;
          }>
        >`
          SELECT 
            COALESCE(SUM(oi."priceCents" * oi.quantity), 0) as total_revenue,
            COALESCE(SUM(pm.views), 0) as product_views,
            COUNT(DISTINCT o.id) as total_orders,
            AVG(o."totalCents") as avg_order_value
          FROM "Product" p
          LEFT JOIN "ProductMetrics" pm ON p.id = pm."productId"
          LEFT JOIN "OrderItem" oi ON p.id = oi."productId"
          LEFT JOIN "Order" o ON oi."orderId" = o.id AND o.status = 'COMPLETED'
          WHERE p."categoryId" = ${product.categoryId}
        `;

        const data = categoryData[0];
        if (data) {
          const conversionRate =
            Number(data.product_views) > 0
              ? (Number(data.total_orders) / Number(data.product_views)) * 100
              : 0;

          await prisma.categoryAnalytics.upsert({
            where: { categoryId: product.categoryId },
            update: {
              viewCount: Number(data.product_views),
              conversionRate,
              averageOrderValue: Number(data.avg_order_value || 0),
              updatedAt: new Date(),
            },
            create: {
              categoryId: product.categoryId,
              viewCount: Number(data.product_views),
              conversionRate,
              averageOrderValue: Number(data.avg_order_value || 0),
            },
          });
        }
      }
    } catch (error) {
      console.error("Error updating category analytics:", error);
    }
  }

  // Update search analytics
  private static async updateSearchAnalytics(
    date: Date,
    query: string,
    resultCount: number
  ): Promise<void> {
    try {
      const dateOnly = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );

      // Get daily search stats
      const searchStats = await prisma.$queryRaw<
        Array<{
          total_searches: bigint;
          unique_queries: bigint;
          no_results_count: bigint;
          click_through_count: bigint;
        }>
      >`
        SELECT 
          COUNT(*) as total_searches,
          COUNT(DISTINCT ae.properties->>'query') as unique_queries,
          COUNT(CASE WHEN (ae.properties->>'resultCount')::int = 0 THEN 1 END) as no_results_count,
          COUNT(CASE WHEN ae.properties->>'clicked' = 'true' THEN 1 END) as click_through_count
        FROM "AnalyticsEvent" ae
        WHERE ae."eventType" = 'SEARCH' 
          AND DATE_TRUNC('day', ae.timestamp) = ${dateOnly}
      `;

      const stats = searchStats[0];
      if (stats) {
        const totalSearches = Number(stats.total_searches);
        const noResultsRate =
          totalSearches > 0
            ? (Number(stats.no_results_count) / totalSearches) * 100
            : 0;
        const clickThroughRate =
          totalSearches > 0
            ? (Number(stats.click_through_count) / totalSearches) * 100
            : 0;

        // Note: SearchAnalytics model tracks individual queries, not daily aggregates
        // This would need to be refactored to work with individual search queries
        console.log("Daily search analytics:", {
          totalSearches,
          uniqueQueries: Number(stats.unique_queries),
          noResultsRate,
          clickThroughRate,
        });
      }
    } catch (error) {
      console.error("Error updating search analytics:", error);
    }
  }

  // Update conversion funnel
  private static async updateConversionFunnel(
    eventType: string,
    sessionId?: string | null
  ): Promise<void> {
    try {
      if (!sessionId) return;

      const stepMapping: Record<string, { step: number; stepName: string }> = {
        PAGE_VIEW: { step: 1, stepName: "Landing" },
        PRODUCT_VIEW: { step: 2, stepName: "Product View" },
        ADD_TO_CART: { step: 3, stepName: "Add to Cart" },
        CHECKOUT_START: { step: 4, stepName: "Checkout" },
        PURCHASE: { step: 5, stepName: "Purchase" },
      };

      const stepInfo = stepMapping[eventType];
      if (!stepInfo) return;

      // Calculate funnel metrics for this step
      const funnelData = await prisma.$queryRaw<
        Array<{
          step_users: bigint;
          prev_step_users: bigint;
        }>
      >`
        WITH step_data AS (
          SELECT COUNT(DISTINCT ae."sessionId") as step_users
          FROM "AnalyticsEvent" ae
          WHERE ae."eventType" = ${eventType}
        ),
        prev_step_data AS (
          SELECT COUNT(DISTINCT ae."sessionId") as prev_step_users
          FROM "AnalyticsEvent" ae
          WHERE ae."eventType" IN (
            CASE ${stepInfo.step}
              WHEN 2 THEN 'PAGE_VIEW'
              WHEN 3 THEN 'PRODUCT_VIEW'
              WHEN 4 THEN 'ADD_TO_CART'
              WHEN 5 THEN 'CHECKOUT_START'
              ELSE 'PAGE_VIEW'
            END
          )
        )
        SELECT s.step_users, p.prev_step_users
        FROM step_data s, prev_step_data p
      `;

      const data = funnelData[0];
      if (data) {
        const users = Number(data.step_users);
        const prevUsers = Number(data.prev_step_users);
        const conversionRate = prevUsers > 0 ? (users / prevUsers) * 100 : 0;
        const dropoffRate = 100 - conversionRate;

        // Note: ConversionFunnel model uses different structure than expected
        // This would need to be refactored to work with the actual schema
        console.log("Conversion funnel step:", {
          step: stepInfo.step,
          stepName: stepInfo.stepName,
          users,
          conversionRate,
          dropoffRate,
        });
      }
    } catch (error) {
      console.error("Error updating conversion funnel:", error);
    }
  }

  // Batch process analytics (run daily via cron)
  static async processAnalytics(date: Date = new Date()): Promise<void> {
    try {
      console.log(
        "Processing analytics for date:",
        date.toISOString().split("T")[0]
      );

      await Promise.all([
        this.processRevenueAnalytics(date),
        this.processCohortAnalysis(date),
        this.processCustomerSegmentation(),
        this.updateAllProductAnalytics(),
        this.updateAllCategoryAnalytics(),
      ]);

      console.log("Analytics processing completed");
    } catch (error) {
      console.error("Error processing analytics:", error);
    }
  }

  // Process daily revenue analytics
  private static async processRevenueAnalytics(date: Date): Promise<void> {
    const dateOnly = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    const revenueData = await prisma.$queryRaw<
      Array<{
        total_revenue: bigint;
        order_count: bigint;
        avg_order_value: number;
        new_customer_revenue: bigint;
        returning_customer_revenue: bigint;
      }>
    >`
      WITH daily_orders AS (
        SELECT 
          o.*,
          CASE WHEN prev_orders.user_id IS NULL THEN 'new' ELSE 'returning' END as customer_type
        FROM "Order" o
        LEFT JOIN (
          SELECT DISTINCT o2."userId" as user_id
          FROM "Order" o2
          WHERE o2.status = 'COMPLETED' 
            AND DATE_TRUNC('day', o2."createdAt") < ${dateOnly}
        ) prev_orders ON o."userId" = prev_orders.user_id
        WHERE o.status = 'COMPLETED'
          AND DATE_TRUNC('day', o."createdAt") = ${dateOnly}
      )
      SELECT 
        COALESCE(SUM(o."totalCents"), 0) as total_revenue,
        COUNT(o.id) as order_count,
        AVG(o."totalCents") as avg_order_value,
        COALESCE(SUM(CASE WHEN o.customer_type = 'new' THEN o."totalCents" ELSE 0 END), 0) as new_customer_revenue,
        COALESCE(SUM(CASE WHEN o.customer_type = 'returning' THEN o."totalCents" ELSE 0 END), 0) as returning_customer_revenue
      FROM daily_orders o
    `;

    const data = revenueData[0];
    if (data) {
      // Check if revenue analytics for this date already exists
      const existing = await prisma.revenueAnalytics.findFirst({
        where: { date: dateOnly },
      });

      if (existing) {
        await prisma.revenueAnalytics.update({
          where: { id: existing.id },
          data: {
            totalRevenue: Number(data.total_revenue),
            orderCount: Number(data.order_count),
            averageOrderValue: Number(data.avg_order_value || 0),
            newCustomerRevenue: Number(data.new_customer_revenue),
            returningCustomerRevenue: Number(data.returning_customer_revenue),
            updatedAt: new Date(),
          },
        });
      } else {
        await prisma.revenueAnalytics.create({
          data: {
            date: dateOnly,
            totalRevenue: Number(data.total_revenue),
            orderCount: Number(data.order_count),
            averageOrderValue: Number(data.avg_order_value || 0),
            newCustomerRevenue: Number(data.new_customer_revenue),
            returningCustomerRevenue: Number(data.returning_customer_revenue),
          },
        });
      }
    }
  }

  // Process cohort analysis (monthly)
  private static async processCohortAnalysis(date: Date): Promise<void> {
    const cohortMonth = new Date(date.getFullYear(), date.getMonth(), 1);

    // This is a simplified version - in practice, you'd calculate retention rates for all cohorts
    const cohortData = await prisma.$queryRaw<
      Array<{
        cohort_size: bigint;
        retention_rate: number;
      }>
    >`
      WITH cohort_users AS (
        SELECT u.id, DATE_TRUNC('month', u."createdAt") as cohort_month
        FROM "User" u
        WHERE DATE_TRUNC('month', u."createdAt") = ${cohortMonth}
          AND u."isAdmin" = false
      )
      SELECT 
        COUNT(cu.id) as cohort_size,
        50.0 as retention_rate -- Placeholder - would calculate actual retention
      FROM cohort_users cu
    `;

    const data = cohortData[0];
    if (data && Number(data.cohort_size) > 0) {
      // Check if cohort analysis for this month already exists
      const existing = await prisma.cohortAnalysis.findFirst({
        where: { cohortDate: cohortMonth },
      });

      if (existing) {
        await prisma.cohortAnalysis.update({
          where: { id: existing.id },
          data: {
            cohortSize: Number(data.cohort_size),
            retentionData: JSON.stringify([100, Number(data.retention_rate)]),
            revenueData: JSON.stringify([0, 0]),
            updatedAt: new Date(),
          },
        });
      } else {
        await prisma.cohortAnalysis.create({
          data: {
            cohortPeriod: "monthly",
            cohortDate: cohortMonth,
            cohortSize: Number(data.cohort_size),
            retentionData: JSON.stringify([100, Number(data.retention_rate)]),
            revenueData: JSON.stringify([0, 0]),
          },
        });
      }
    }
  }

  // Process customer segmentation
  private static async processCustomerSegmentation(): Promise<void> {
    const segments = [
      { name: "VIP", criteria: { minOrders: 5, minSpent: 50000 } },
      { name: "Loyal", criteria: { minOrders: 3, minSpent: 25000 } },
      { name: "Regular", criteria: { minOrders: 1, minSpent: 10000 } },
      { name: "New", criteria: { minOrders: 1, minSpent: 0 } },
      { name: "Browser", criteria: { minOrders: 0, minSpent: 0 } },
    ];

    for (const segment of segments) {
      // Check if segment already exists
      const existing = await prisma.customerSegment.findFirst({
        where: { name: segment.name },
      });

      if (existing) {
        await prisma.customerSegment.update({
          where: { id: existing.id },
          data: {
            criteria: JSON.stringify(segment.criteria),
            updatedAt: new Date(),
          },
        });
      } else {
        await prisma.customerSegment.create({
          data: {
            name: segment.name,
            criteria: JSON.stringify(segment.criteria),
          },
        });
      }
    }
  }

  // Update analytics for all products
  private static async updateAllProductAnalytics(): Promise<void> {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    for (const product of products) {
      await this.updateProductAnalytics(product.id);
    }
  }

  // Update analytics for all categories
  private static async updateAllCategoryAnalytics(): Promise<void> {
    const categories = await prisma.category.findMany({
      select: { id: true },
    });

    for (const category of categories) {
      const products = await prisma.product.findMany({
        where: { categoryId: category.id },
        select: { id: true },
      });

      if (products.length > 0) {
        await this.updateCategoryAnalytics(products[0].id);
      }
    }
  }
}

// Export helper functions for use in API routes
export const trackEvent = AnalyticsTracker.trackEvent.bind(AnalyticsTracker);
export const trackPageView =
  AnalyticsTracker.trackPageView.bind(AnalyticsTracker);
export const trackProductView =
  AnalyticsTracker.trackProductView.bind(AnalyticsTracker);
export const trackProductPurchase =
  AnalyticsTracker.trackProductPurchase.bind(AnalyticsTracker);
export const trackSearch = AnalyticsTracker.trackSearch.bind(AnalyticsTracker);
export const trackCartEvent =
  AnalyticsTracker.trackCartEvent.bind(AnalyticsTracker);
export const startSession =
  AnalyticsTracker.startSession.bind(AnalyticsTracker);
export const endSession = AnalyticsTracker.endSession.bind(AnalyticsTracker);
export const processAnalytics =
  AnalyticsTracker.processAnalytics.bind(AnalyticsTracker);
