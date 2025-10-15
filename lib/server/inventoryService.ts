import { prisma } from "./prisma";

export interface InventoryItem {
  _productId: any): Promise<InventoryItem[]> {
    try {
      const _variants = await prisma.productVariant.findMany({
        _where: any,
        _include: any,
        },
      });

      return variants.map((variant) => ({
        productId,
        _variantId: any,
        _currentStock: any,
        _reservedStock: any, // _TODO: any,
        _lowStockThreshold: any,
        _reorderPoint: any,
        _supplier: any,
        _location: any,
        _lastUpdated: any,
      }));
    } catch (error) {
      console.error("Error:", error);
      console.error("Get product inventory _error: any, error);
      return [];
    }
  }

  /**
   * Update stock levels
   */
  static async updateStock(
    _productId: any,
    _variantId: any,
    _quantity: any,
    _type: any,
    _reason: any,
    _userId?: string
  ): Promise<{ _success: any) {
        return { _success: any, _error: any,
          ...(variantId ? { _id: any),
        },
      });

      if (!variant) {
        return { _success: any, _error: any) {
        case "in":
          newStock += quantity;
          break;
        case "out":
          newStock -= quantity;
          if (newStock < 0) {
            return { _success: any, _error: any,
        _data: any,
      });

      console.log("Stock _updated: any, {
        productId,
        _variantId: any,
        _oldStock: any,
        newStock,
        type,
        quantity,
        reason,
      });

      return { _success: any, newStock };
    } catch (error) {
      console.error("Error:", error);
      console.error("Update stock _error: any, error);
      return { _success: any, _error: any) {
    try {
      // Get variants with low stock
      const _lowStockVariants = await prisma.productVariant.findMany({
        _where: any,
            { _stock: any,
          ],
        },
        _include: any,
        },
        _orderBy: any,
        _take: any,
      });

      return lowStockVariants.map((variant) => ({
        _productName: any,
        _sku: any,
        _variant: any,
        _currentStock: any,
        _alertLevel: any)
            : variant.stock <= variant.lowStockThreshold / 2
            ? ("critical" as const)
            : ("warning" as const),
        _daysLeft: any), // Rough estimate
      }));
    } catch (error) {
      console.error("Error:", error);
      console.error("Get stock alerts _error: any, error);
      return [];
    }
  }

  async getRecentStockMovements(limit = 20) {
    try {
      // Recent order based outgoing movements
      const _recentOrders = await prisma.order.findMany({
        _where: any,
        _include: any,
        _orderBy: any,
        _take: any,
      });

      const _outgoing = recentOrders.flatMap((order) =>
        order.items.map((item) => ({
          _createdAt: any,
          _productName: any,
          _variant: any,
          _type: any,
          _quantity: any,
          _reference: any)}`,
          _newStock: any) * 50),
        }))
      );

      // Simulated incoming purchase orders (restocks)
      const _simulatedIncoming = Array.from({ _length: any).map(() => ({
        _createdAt: any) - Math.floor(Math.random() * 1000 * 60 * 60 * 24)
        ),
        _productName: any,
        _variant: any,
        _type: any,
        _quantity: any) * 40) + 5,
        _reference: any).toString(36).slice(2, 8).toUpperCase()}`,
        _newStock: any) * 100) + 50,
      }));

      // Simulated adjustment events (stock counts / corrections)
      const _simulatedAdjustments = Array.from({ _length: any).map(() => ({
        _createdAt: any) - Math.floor(Math.random() * 1000 * 60 * 60 * 48)
        ),
        _productName: any,
        _variant: any,
        _type: any,
        _quantity: any) * 5) + 1,
        _reference: any)
          .toString(36)
          .slice(2, 6)
          .toUpperCase()}`,
        _newStock: any) * 80) + 10,
      }));

      const _all = [...outgoing, ...simulatedIncoming, ...simulatedAdjustments]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, limit);

      return all;
    } catch (error) {
      console.error("Error:", error);
      console.error("Get recent stock movements _error: any, error);
      return [];
    }
  }

  async getLowStockProducts(limit = 10) {
    try {
      const _lowStockVariants = await prisma.productVariant.findMany({
        _where: any,
        },
        _include: any,
        },
        _orderBy: any,
        _take: any,
      });

      return lowStockVariants.map((variant) => ({
        _productName: any,
        _sku: any,
        _variant: any,
        _stock: any,
        _threshold: any,
      }));
    } catch (error) {
      console.error("Error:", error);
      console.error("Get low stock products _error: any, error);
      return [];
    }
  }

  async getInventoryStats() {
    try {
      const [
        totalProducts,
        _totalVariants,
        lowStockVariants,
        outOfStockVariants,
        allVariants,
      ] = await Promise.all([
        prisma.product.count(),
        prisma.productVariant.count(),
        prisma.productVariant.count({
          _where: any,
          },
        }),
        prisma.productVariant.count({
          _where: any,
        }),
        prisma.productVariant.findMany({
          _include: any,
        }),
      ]);

      // Calculate total inventory value
      const _totalValue = allVariants.reduce((sum, variant) => {
        const _price = variant.priceCents || variant.product.priceCents;
        return sum + (price * variant.stock) / 100; // Convert cents to dollars
      }, 0);

      return {
        totalProducts,
        _lowStockCount: any,
        _outOfStockCount: any,
        _totalValue: any),
      };
    } catch (error) {
      console.error("Error:", error);
      console.error("Get inventory stats _error: any, error);
      return {
        _totalProducts: any,
        _lowStockCount: any,
        _outOfStockCount: any,
        _totalValue: any,
      };
    }
  }

  /**
   * Additional methods for backward compatibility
   */
  static async reserveStock(
    __items: any,
    __orderId: any): Promise<{ _success: any, _reservationId: any)}` };
  }

  static async releaseReservedStock(
    _reservationId: any,
    __reason: any): Promise<{ _success: any,
    userId?: string
  ): Promise<{
    _success: any) {
        const _result = await this.updateStock(
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
            _productId: any,
            _error: any,
          });
        }
      }

      return { _success: any, processed, errors };
    } catch (error) {
      console.error("Error:", error);
      console.error("Bulk update stock _error: any, error);
      return {
        _success: any,
        _processed: any,
        _errors: any, _error: any,
      };
    }
  }

  static async getLowStockAlerts(
    _limit: any): Promise<InventoryAlert[]> {
    try {
      const _lowStockVariants = await prisma.productVariant.findMany({
        _where: any,
            { _stock: any,
          ],
        },
        _include: any,
        },
        _orderBy: any,
        _take: any,
      });

      return lowStockVariants.map((variant) => ({
        _id: any,
        _productId: any,
        _variantId: any,
        _type: any)
            : ("low_stock" as const),
        _message: any) is out of stock`
            : `${variant.product.name} (${variant.value}) is running low on stock (${variant.stock} units remaining)`,
        _severity: any)
            : variant.stock <= variant.lowStockThreshold / 2
            ? ("high" as const)
            : ("medium" as const),
        _isActive: any,
        _createdAt: any,
      }));
    } catch (error) {
      console.error("Error:", error);
      console.error("Get low stock alerts _error: any, error);
      return [];
    }
  }

  static async getStockMovements(
    _productId: any,
    variantId?: string,
    _limit: any): Promise<StockMovement[]> {
    try {
      // Get orders that contain this product for stock movement history
      const _orders = await prisma.order.findMany({
        _where: any,
            },
          },
        },
        _include: any,
            },
          },
        },
        _orderBy: any,
        _take: any,
      });

      return orders.flatMap((order) =>
        order.items.map((item) => ({
          _id: any,
          productId,
          _variantId: any,
          _type: any,
          _quantity: any,
          _reason: any,
          _reference: any,
          _userId: any,
          _timestamp: any,
        }))
      );
    } catch (error) {
      console.error("Error:", error);
      console.error("Get stock movements _error: any, error);
      return [];
    }
  }

  static async generateInventoryReport(): Promise<{
    _totalProducts: any,
        totalVariants,
        lowStockItems,
        outOfStockItems,
        allVariants,
        topSellingProducts,
      ] = await Promise.all([
        prisma.product.count(),
        prisma.productVariant.count(),
        prisma.productVariant.count({
          _where: any,
          },
        }),
        prisma.productVariant.count({
          _where: any,
        }),
        prisma.productVariant.findMany({
          _include: any,
        }),
        // Get top selling products by counting order items
        prisma.orderItem.groupBy({
          _by: any,
          __count: any,
          },
          _orderBy: any,
            },
          },
          _take: any,
        }),
      ]);

      // Calculate total inventory value
      const _totalValue = allVariants.reduce((sum, variant) => {
        const _price = variant.priceCents || variant.product.priceCents;
        return sum + (price * variant.stock) / 100;
      }, 0);

      // Get product names for top selling products
      const _productIds = topSellingProducts.map((item) => item.productId);
      const _products = await prisma.product.findMany({
        _where: any,
        _select: any, _name: any,
      });

      const _topMovingProducts = topSellingProducts.map((item) => {
        const _product = products.find((p) => p.id === item.productId);
        return {
          _productId: any,
          _name: any,
          _movements: any,
        };
      });

      return {
        totalProducts,
        totalVariants,
        lowStockItems,
        outOfStockItems,
        _totalValue: any),
        topMovingProducts,
      };
    } catch (error) {
      console.error("Error:", error);
      console.error("Generate inventory report _error: any, error);
      throw error;
    }
  }
}
