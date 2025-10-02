import { prisma } from "./prisma";

export interface InventoryItem {
  productId: string;
  variantId?: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  lowStockThreshold: number;
  reorderPoint: number;
  supplier?: string;
  location?: string;
  lastUpdated: Date;
}

export interface StockMovement {
  id: string;
  productId: string;
  variantId?: string;
  type: "in" | "out" | "reserved" | "released" | "adjustment";
  quantity: number;
  reason: string;
  reference?: string;
  userId?: string;
  timestamp: Date;
}

export interface InventoryAlert {
  id: string;
  productId: string;
  variantId?: string;
  type: "low_stock" | "out_of_stock" | "reorder" | "excess_stock";
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  isActive: boolean;
  createdAt: Date;
}

export interface BulkStockUpdate {
  productId: string;
  variantId?: string;
  quantity: number;
  reason: string;
}

/**
 * Advanced Inventory Management Service with Real Database Integration
 */
export class InventoryService {
  /**
   * Get inventory status for a product
   */
  static async getProductInventory(
    productId: string
  ): Promise<InventoryItem[]> {
    try {
      const variants = await prisma.productVariant.findMany({
        where: { productId },
        include: {
          product: true,
        },
      });

      return variants.map((variant) => ({
        productId,
        variantId: variant.id,
        currentStock: variant.stock,
        reservedStock: 0, // TODO: Implement reservation tracking
        availableStock: variant.stock,
        lowStockThreshold: variant.lowStockThreshold,
        reorderPoint: variant.lowStockThreshold * 2,
        supplier: "Main Supplier",
        location: "Warehouse A",
        lastUpdated: variant.updatedAt,
      }));
    } catch (error) {
      console.error("Get product inventory error:", error);
      return [];
    }
  }

  /**
   * Update stock levels
   */
  static async updateStock(
    productId: string,
    variantId: string | undefined,
    quantity: number,
    type: "in" | "out" | "adjustment",
    reason: string,
    userId?: string
  ): Promise<{ success: boolean; newStock?: number; error?: string }> {
    try {
      // Validate quantity
      if (quantity <= 0 && type !== "adjustment") {
        return { success: false, error: "Invalid quantity" };
      }

      // Find the variant
      const variant = await prisma.productVariant.findFirst({
        where: {
          productId,
          ...(variantId ? { id: variantId } : {}),
        },
      });

      if (!variant) {
        return { success: false, error: "Product variant not found" };
      }

      let newStock = variant.stock;

      switch (type) {
        case "in":
          newStock += quantity;
          break;
        case "out":
          newStock -= quantity;
          if (newStock < 0) {
            return { success: false, error: "Insufficient stock" };
          }
          break;
        case "adjustment":
          newStock = quantity;
          break;
      }

      // Update the stock
      await prisma.productVariant.update({
        where: { id: variant.id },
        data: { stock: newStock },
      });

      console.log("Stock updated:", {
        productId,
        variantId: variant.id,
        oldStock: variant.stock,
        newStock,
        type,
        quantity,
        reason,
      });

      return { success: true, newStock };
    } catch (error) {
      console.error("Update stock error:", error);
      return { success: false, error: "Failed to update stock" };
    }
  }

  /**
   * Admin interface methods
   */
  async getStockAlerts() {
    try {
      // Get variants with low stock
      const lowStockVariants = await prisma.productVariant.findMany({
        where: {
          OR: [
            { stock: { lte: prisma.productVariant.fields.lowStockThreshold } },
            { stock: 0 },
          ],
        },
        include: {
          product: true,
        },
        orderBy: { stock: "asc" },
        take: 20,
      });

      return lowStockVariants.map((variant) => ({
        productName: variant.product.name,
        sku: variant.sku,
        variant: `${variant.type}: ${variant.value}`,
        currentStock: variant.stock,
        alertLevel:
          variant.stock === 0
            ? ("critical" as const)
            : variant.stock <= variant.lowStockThreshold / 2
            ? ("critical" as const)
            : ("warning" as const),
        daysLeft: variant.stock === 0 ? null : Math.floor(variant.stock / 2), // Rough estimate
      }));
    } catch (error) {
      console.error("Get stock alerts error:", error);
      return [];
    }
  }

  async getRecentStockMovements(limit = 20) {
    try {
      // Get recent orders to simulate stock movements
      const recentOrders = await prisma.order.findMany({
        where: {
          status: { not: "PENDING" },
        },
        include: {
          items: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      const movements = recentOrders.flatMap((order) =>
        order.items.map((item) => ({
          createdAt: order.createdAt,
          productName: item.nameSnapshot,
          variant: item.size ? `Size: ${item.size}` : "Standard",
          type: "outgoing" as const,
          quantity: item.qty,
          reference: `Order #${order.id.slice(-6)}`,
          newStock: Math.floor(Math.random() * 50), // TODO: Track actual stock changes
        }))
      );

      return movements.slice(0, limit);
    } catch (error) {
      console.error("Get recent stock movements error:", error);
      return [];
    }
  }

  async getLowStockProducts(limit = 10) {
    try {
      const lowStockVariants = await prisma.productVariant.findMany({
        where: {
          stock: { lte: prisma.productVariant.fields.lowStockThreshold },
        },
        include: {
          product: true,
        },
        orderBy: { stock: "asc" },
        take: limit,
      });

      return lowStockVariants.map((variant) => ({
        productName: variant.product.name,
        sku: variant.sku,
        variant: `${variant.type}: ${variant.value}`,
        stock: variant.stock,
        threshold: variant.lowStockThreshold,
      }));
    } catch (error) {
      console.error("Get low stock products error:", error);
      return [];
    }
  }

  async getInventoryStats() {
    try {
      const [
        totalProducts,
        totalVariants,
        lowStockVariants,
        outOfStockVariants,
        allVariants,
      ] = await Promise.all([
        prisma.product.count(),
        prisma.productVariant.count(),
        prisma.productVariant.count({
          where: {
            stock: { lte: prisma.productVariant.fields.lowStockThreshold },
          },
        }),
        prisma.productVariant.count({
          where: { stock: 0 },
        }),
        prisma.productVariant.findMany({
          include: { product: true },
        }),
      ]);

      // Calculate total inventory value
      const totalValue = allVariants.reduce((sum, variant) => {
        const price = variant.priceCents || variant.product.priceCents;
        return sum + (price * variant.stock) / 100; // Convert cents to dollars
      }, 0);

      return {
        totalProducts,
        lowStockCount: lowStockVariants,
        outOfStockCount: outOfStockVariants,
        totalValue: Math.round(totalValue),
      };
    } catch (error) {
      console.error("Get inventory stats error:", error);
      return {
        totalProducts: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        totalValue: 0,
      };
    }
  }

  /**
   * Additional methods for backward compatibility
   */
  static async reserveStock(
    items: Array<{ productId: string; variantId?: string; quantity: number }>,
    orderId: string
  ): Promise<{ success: boolean; reservationId?: string; error?: string }> {
    // TODO: Implement reservation system
    return { success: true, reservationId: `res_${Date.now()}` };
  }

  static async releaseReservedStock(
    reservationId: string,
    reason: string = "Order cancelled"
  ): Promise<{ success: boolean; error?: string }> {
    // TODO: Implement reservation release
    return { success: true };
  }

  static async bulkUpdateStock(
    updates: BulkStockUpdate[],
    userId?: string
  ): Promise<{
    success: boolean;
    processed: number;
    errors: Array<{ productId: string; error: string }>;
  }> {
    try {
      let processed = 0;
      const errors: Array<{ productId: string; error: string }> = [];

      for (const update of updates) {
        const result = await this.updateStock(
          update.productId,
          update.variantId,
          update.quantity,
          "adjustment",
          update.reason,
          userId
        );

        if (result.success) {
          processed++;
        } else {
          errors.push({
            productId: update.productId,
            error: result.error || "Unknown error",
          });
        }
      }

      return { success: true, processed, errors };
    } catch (error) {
      console.error("Bulk update stock error:", error);
      return {
        success: false,
        processed: 0,
        errors: [{ productId: "all", error: "Bulk update failed" }],
      };
    }
  }

  static async getLowStockAlerts(
    limit: number = 50
  ): Promise<InventoryAlert[]> {
    try {
      const lowStockVariants = await prisma.productVariant.findMany({
        where: {
          OR: [
            { stock: { lte: prisma.productVariant.fields.lowStockThreshold } },
            { stock: 0 },
          ],
        },
        include: {
          product: true,
        },
        orderBy: { stock: "asc" },
        take: limit,
      });

      return lowStockVariants.map((variant) => ({
        id: `alert_${variant.id}`,
        productId: variant.productId,
        variantId: variant.id,
        type:
          variant.stock === 0
            ? ("out_of_stock" as const)
            : ("low_stock" as const),
        message:
          variant.stock === 0
            ? `${variant.product.name} (${variant.value}) is out of stock`
            : `${variant.product.name} (${variant.value}) is running low on stock (${variant.stock} units remaining)`,
        severity:
          variant.stock === 0
            ? ("critical" as const)
            : variant.stock <= variant.lowStockThreshold / 2
            ? ("high" as const)
            : ("medium" as const),
        isActive: true,
        createdAt: variant.updatedAt,
      }));
    } catch (error) {
      console.error("Get low stock alerts error:", error);
      return [];
    }
  }

  static async getStockMovements(
    productId: string,
    variantId?: string,
    limit: number = 100
  ): Promise<StockMovement[]> {
    try {
      // Get orders that contain this product for stock movement history
      const orders = await prisma.order.findMany({
        where: {
          items: {
            some: {
              productId,
            },
          },
        },
        include: {
          items: {
            where: {
              productId,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      return orders.flatMap((order) =>
        order.items.map((item) => ({
          id: `move_${order.id}_${item.id}`,
          productId,
          variantId: variantId,
          type: "out" as const,
          quantity: item.qty,
          reason: "Sale",
          reference: order.id,
          userId: order.userId || undefined,
          timestamp: order.createdAt,
        }))
      );
    } catch (error) {
      console.error("Get stock movements error:", error);
      return [];
    }
  }

  static async generateInventoryReport(): Promise<{
    totalProducts: number;
    totalVariants: number;
    lowStockItems: number;
    outOfStockItems: number;
    totalValue: number;
    topMovingProducts: Array<{
      productId: string;
      name: string;
      movements: number;
    }>;
  }> {
    try {
      const [
        totalProducts,
        totalVariants,
        lowStockItems,
        outOfStockItems,
        allVariants,
        topSellingProducts,
      ] = await Promise.all([
        prisma.product.count(),
        prisma.productVariant.count(),
        prisma.productVariant.count({
          where: {
            stock: { lte: prisma.productVariant.fields.lowStockThreshold },
          },
        }),
        prisma.productVariant.count({
          where: { stock: 0 },
        }),
        prisma.productVariant.findMany({
          include: { product: true },
        }),
        // Get top selling products by counting order items
        prisma.orderItem.groupBy({
          by: ["productId"],
          _count: {
            productId: true,
          },
          orderBy: {
            _count: {
              productId: "desc",
            },
          },
          take: 5,
        }),
      ]);

      // Calculate total inventory value
      const totalValue = allVariants.reduce((sum, variant) => {
        const price = variant.priceCents || variant.product.priceCents;
        return sum + (price * variant.stock) / 100;
      }, 0);

      // Get product names for top selling products
      const productIds = topSellingProducts.map((item) => item.productId);
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true },
      });

      const topMovingProducts = topSellingProducts.map((item) => {
        const product = products.find((p) => p.id === item.productId);
        return {
          productId: item.productId,
          name: product?.name || "Unknown Product",
          movements: item._count.productId,
        };
      });

      return {
        totalProducts,
        totalVariants,
        lowStockItems,
        outOfStockItems,
        totalValue: Math.round(totalValue),
        topMovingProducts,
      };
    } catch (error) {
      console.error("Generate inventory report error:", error);
      throw error;
    }
  }
}
