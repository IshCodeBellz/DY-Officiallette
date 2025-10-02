// CLEAN STUB FILE
// If this file becomes corrupted again, investigate editor or tooling interference.
// Do not add any extra code here until Prisma schema supports needed models.

export interface CreateProductVariantInput {
  productId: string;
  type: "size" | "style" | "color" | "material";
  value: string;
  hexColor?: string;
  stock: number;
  priceCents?: number;
  isActive?: boolean;
}

export class ProductManagementService {
  static async createProductVariant(_data: CreateProductVariantInput): Promise<{ success: boolean; error: string }> {
    return { success: false, error: "Product variant feature disabled" };
  }
  static async getProductVariants(_productId: string): Promise<any[]> { return []; }
  static async updateVariantStock(_variantId: string, _newStock: number): Promise<null> { return null; }
  static async createInventoryAlert(_productId: string): Promise<void> { /* intentionally empty */ }
  static async checkInventoryAlerts(_variant: any): Promise<void> { /* intentionally empty */ }
  static async getInventoryAlerts(): Promise<any[]> { return []; }
  static async createProductBundle(_data: any): Promise<{ success: boolean; error: string }> {
    return { success: false, error: "Bundles disabled" };
  }
  static async getProductBundles(): Promise<any[]> { return []; }
  static async generateBulkProducts(_count: number, _category: string): Promise<{ success: boolean; created: number; error: string }> {
    return { success: false, created: 0, error: "Bulk generation disabled" };
  }
}

  static async getInventoryAlerts(): Promise<InventoryAlert[]> {  productId: string;

    return [];  sku: string;

  }  name: string;

  type: "color" | "size" | "material" | "style";

  /**  value: string;

   * Create product bundle - STUB  hexColor?: string;

   */  priceCents?: number;

  static async createProductBundle(data: any): Promise<{ success: boolean; bundle?: ProductBundle; error?: string }> {  stock: number;

    console.log("CreateProductBundle stub", data);  lowStockThreshold?: number;

    return {  imageUrl?: string;

      success: false,}

      error: "Product bundles feature requires proper schema implementation"

    };export interface ProductBundle {

  }  id: string;

  name: string;

  /**  description?: string;

   * Get product bundles - STUB  discountPercent?: number;

   */  discountCents?: number;

  static async getProductBundles(): Promise<ProductBundle[]> {  products: string[]; // Product IDs

    return [];  isActive: boolean;

  }  validFrom?: Date;

  validTo?: Date;

  /**}

   * Generate bulk products - STUB

   */export interface InventoryAlert {

  static async generateBulkProducts(  id: string;

    count: number,   productId?: string;

    category: string  variantId?: string;

  ): Promise<{ success: boolean; created: number; error?: string }> {  alertType: "low_stock" | "out_of_stock" | "restock";

    console.log(`Bulk generation stub - count: ${count}, category: ${category}`);  threshold?: number;

    return {  currentStock?: number;

      success: false,  message: string;

      created: 0,  isResolved: boolean;

      error: "Use existing seed scripts for bulk product generation"}

    };

  }/**

} * Advanced Product Management Service for Phase 3
 */
export class ProductManagementService {
  /**
   * Create a new product variant
   */
  static async createProductVariant(
    data: CreateProductVariantInput
  ): Promise<{ success: boolean; variant?: ProductVariant; error?: string }> {
    try {
      // Validate that the product exists
      const product = await prisma.product.findUnique({
        where: { id: data.productId },
      });

      if (!product) {
        return { success: false, error: "Product not found" };
      }

      // Check if variant with same type and value already exists
      const existingVariant = await prisma.productVariant.findFirst({
        where: {
          productId: data.productId,
          type: data.type,
          value: data.value,
        },
      });

      if (existingVariant) {
        return {
          success: false,
          error: "Variant with this type and value already exists",
        };
      }

      const variant = await prisma.productVariant.create({
        data: {
          productId: data.productId,
          type: data.type,
          value: data.value,
          hexColor: data.hexColor,
          stock: data.stock || 0,
          priceCents: data.priceCents,
          isActive: data.isActive ?? true,
        },
      });

      // Create inventory alert if stock is low
      if (variant.stock <= 10) {
        await this.createInventoryAlert(
          data.productId,
          // ============================================================
          // Product Management Stub (Phase deferred)
          // ------------------------------------------------------------
          // The original implementation was removed due to schema mismatch
          // and file corruption. This minimal stub satisfies imports and
          // prevents TypeScript compile failures until proper Phase 3
          // models (variants, bundles, inventory alerts, relations) exist.
          // ============================================================

          // Lightweight shapes used only for typing outward responses
          export interface CreateProductVariantInput {
            productId: string;
            type: "size" | "style" | "color" | "material";
            value: string;
            stock: number;
            hexColor?: string;
            priceCents?: number;
            isActive?: boolean;
          }

          type BasicResult = { success: boolean; error?: string };

          export class ProductManagementService {
            // Variant API (disabled)
            static async createProductVariant(_data: CreateProductVariantInput): Promise<BasicResult> {
              return { success: false, error: "Product variants not enabled" };
            }
            static async getProductVariants(_productId: string): Promise<any[]> { return []; }
            static async updateVariantStock(_variantId: string, _delta: number): Promise<BasicResult> {
              return { success: false, error: "Stock updates disabled" };
            }

            // Inventory Alerts (disabled)
            static async checkInventoryAlerts(_variant: any): Promise<void> { /* noop */ }
            static async createInventoryAlert(_productId: string): Promise<void> { /* noop */ }
            static async getInventoryAlerts(): Promise<any[]> { return []; }

            // Bundles (disabled)
            static async createProductBundle(_data: any): Promise<BasicResult> {
              return { success: false, error: "Product bundles not enabled" };
            }
            static async getProductBundles(): Promise<any[]> { return []; }

            // Relations / Recommendations (disabled)
            static async relateProducts(_a: string, _b: string): Promise<BasicResult> {
              return { success: false, error: "Product relations not enabled" };
            }
            static async getRelatedProducts(_productId: string): Promise<any[]> { return []; }

            // Bulk generation (use prisma seed instead)
            static async generateBulkProducts(_count: number, _category: string): Promise<{ success: boolean; created: number; error?: string }> {
              return { success: false, created: 0, error: "Bulk generation disabled (use seed script)" };
            }
          }

          // NOTE: When enabling these features:
          // 1. Add corresponding Prisma models & migrate
          // 2. Replace stub methods with real implementations
          // 3. Add unit tests covering each public method
          // 4. Remove this header block

  /**
   * Update variant stock
   */
  static async updateVariantStock(
    variantId: string,
    newStock: number,
    operation: "set" | "increment" | "decrement" = "set"
  ): Promise<ProductVariant> {
    try {
      const currentVariant = await prisma.productVariant.findUnique({
        where: { id: variantId },
      });

      if (!currentVariant) {
        throw new Error("Variant not found");
      }

      let finalStock = newStock;

      if (operation === "increment") {
        finalStock = currentVariant.stock + newStock;
      } else if (operation === "decrement") {
        /**
         * Minimal Product Management Stub
         * All advanced features intentionally disabled until schema support is added.
         * This file replaces a previously corrupted version.
         */

        export interface CreateProductVariantInput {
          productId: string;
          type: "size" | "style" | "color" | "material";
          value: string;
          hexColor?: string;
          stock: number;
          priceCents?: number;
          isActive?: boolean;
        }

        export class ProductManagementService {
          static async createProductVariant(_data: CreateProductVariantInput): Promise<{ success: boolean; error: string }> {
            return { success: false, error: "Product variant feature disabled" };
          }
          static async getProductVariants(_productId: string): Promise<any[]> { return []; }
          static async updateVariantStock(_variantId: string, _newStock: number): Promise<null> { return null; }
          static async createInventoryAlert(_productId: string): Promise<void> { /* noop */ }
          static async checkInventoryAlerts(_variant: any): Promise<void> { /* noop */ }
          static async getInventoryAlerts(): Promise<any[]> { return []; }
          static async createProductBundle(_data: any): Promise<{ success: boolean; error: string }> {
            return { success: false, error: "Bundles disabled" };
          }
          static async getProductBundles(): Promise<any[]> { return []; }
          static async generateBulkProducts(_count: number, _category: string): Promise<{ success: boolean; created: number; error: string }> {
            return { success: false, created: 0, error: "Bulk generation disabled" };
          }
      throw new Error("Failed to create product bundle");
    }
  }

  /**
   * Get product bundles
   */
  static async getProductBundles(
    activeOnly: boolean = true
  ): Promise<ProductBundle[]> {
    try {
      const bundles = await prisma.productBundle.findMany({
        where: activeOnly ? { isActive: true } : {},
        include: {
          products: {
            select: {
              id: true,
              name: true,
              priceCents: true,
              images: {
                take: 1,
                orderBy: { position: "asc" },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return bundles.map((bundle) => ({
        id: bundle.id,
        name: bundle.name,
        description: bundle.description,
        discountPercent: bundle.discountPercent,
        discountCents: bundle.discountCents,
        products: bundle.products.map((p) => p.id),
        isActive: bundle.isActive,
        validFrom: bundle.validFrom,
        validTo: bundle.validTo,
      }));
    } catch (error) {
      console.error("Error fetching product bundles:", error);
      return [];
    }
  }

  /**
   * Add related products
   */
  static async addRelatedProduct(
    productId: string,
    relatedProductId: string,
    relationType: "cross_sell" | "up_sell" | "similar" | "alternative",
    weight: number = 1.0
  ): Promise<void> {
    try {
      await prisma.productRelation.upsert({
        where: {
          productId_relatedProductId_relationType: {
            productId,
            relatedProductId,
            relationType,
          },
        },
        create: {
          productId,
          relatedProductId,
          relationType,
          weight,
        },
        update: {
          weight,
        },
      });
    } catch (error) {
      console.error("Error adding related product:", error);
      throw new Error("Failed to add related product");
    }
  }

  /**
   * Get related products
   */
  static async getRelatedProducts(
    productId: string,
    relationType?: "cross_sell" | "up_sell" | "similar" | "alternative"
  ): Promise<any[]> {
    try {
      const relations = await prisma.productRelation.findMany({
        where: {
          productId,
          ...(relationType && { relationType }),
        },
        include: {
          relatedProduct: {
            include: {
              images: {
                take: 1,
                orderBy: { position: "asc" },
              },
              brand: true,
              variants: {
                where: { isActive: true },
                orderBy: { position: "asc" },
              },
            },
          },
        },
        orderBy: { weight: "desc" },
      });

      return relations.map((relation) => relation.relatedProduct);
    } catch (error) {
      console.error("Error fetching related products:", error);
      return [];
    }
  }

  /**
   * Bulk import products with variants
   */
  static async bulkImportProducts(
    products: any[]
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    try {
      for (const productData of products) {
        try {
          // Create main product
          const product = await prisma.product.create({
            data: {
              sku: productData.sku,
              name: productData.name,
              description: productData.description,
              priceCents: productData.priceCents,
              brandId: productData.brandId,
              categoryId: productData.categoryId,
              tags: JSON.stringify(productData.tags || []),
              materials: JSON.stringify(productData.materials || []),
              careInstructions: productData.careInstructions,
            },
          });

          // Create variants if provided
          if (productData.variants && productData.variants.length > 0) {
            for (const variantData of productData.variants) {
              await this.createVariant({
                productId: product.id,
                ...variantData,
              });
            }
          }

          // Create images if provided
          if (productData.images && productData.images.length > 0) {
            for (let i = 0; i < productData.images.length; i++) {
              const image = productData.images[i];
              await prisma.productImage.create({
                data: {
                  productId: product.id,
                  url: image.url,
                  alt: image.alt || productData.name,
                  position: i,
                  imageType: image.type || "gallery",
                },
              });
            }
          }

          success++;
        } catch (error) {
          failed++;
          errors.push(
            `Product ${productData.sku}: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      }

      return { success, failed, errors };
    } catch (error) {
      console.error("Bulk import error:", error);
      throw new Error("Bulk import failed");
    }
  }

  /**
   * Get low stock products summary
   */
  static async getLowStockSummary(): Promise<{
    totalLowStock: number;
    totalOutOfStock: number;
    criticalProducts: any[];
  }> {
    try {
      // Get low stock variants
      const lowStockVariants = await prisma.productVariant.findMany({
        where: {
          OR: [
            { stock: { lte: prisma.productVariant.fields.lowStockThreshold } },
            { stock: 0 },
          ],
          isActive: true,
        },
        include: {
          product: {
            select: {
              name: true,
              sku: true,
            },
          },
        },
      });

      const totalLowStock = lowStockVariants.filter(
        (v) => v.stock > 0 && v.stock <= v.lowStockThreshold
      ).length;
      const totalOutOfStock = lowStockVariants.filter(
        (v) => v.stock === 0
      ).length;

      const criticalProducts = lowStockVariants
        .filter((v) => v.stock === 0)
        .slice(0, 10)
        .map((variant) => ({
          productName: variant.product.name,
          variantName: variant.name,
          sku: variant.sku,
          stock: variant.stock,
        }));

      return {
        totalLowStock,
        totalOutOfStock,
        criticalProducts,
      };
    } catch (error) {
      console.error("Error getting low stock summary:", error);
      return {
        totalLowStock: 0,
        totalOutOfStock: 0,
        criticalProducts: [],
      };
    }
  }
}
