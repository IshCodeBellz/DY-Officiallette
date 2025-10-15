#!/usr/bin/env npx tsx

/**
 * Cache Warming Script
 *
 * This script preloads frequently accessed data into Redis cache
 * to improve application performance during peak usage.
 */

import CacheManager from "../lib/server/performance/CacheManager";
import { RedisService } from "../lib/server/performance/RedisService";
import { prisma } from "../lib/server/prisma";

interface WarmupOptions {
  products?: boolean;
  categories?: boolean;
  featuredContent?: boolean;
  searchQueries?: boolean;
  brands?: boolean;
}

async function main() {
  console.log("🔥 Starting cache warmup process...\n");

  const redis = RedisService.getInstance();

  // Check Redis connectivity
  if (!redis.isHealthy()) {
    console.log("❌ Redis is not available. Cache warming skipped.");
    console.log(
      "💡 Tip: Ensure Redis is running and REDIS_URL is configured in your environment."
    );
    return;
  }

  const options: WarmupOptions = {
    products: true,
    categories: true,
    featuredContent: true,
    searchQueries: true,
    brands: true,
  };

  const startTime = Date.now();

  try {
    // 1. Warm product cache
    if (options.products) {
      console.log("📦 Warming product cache...");
      await CacheManager.warmProductCache(200); // Cache top 200 products
      console.log("✅ Product cache warmed\n");
    }

    // 2. Warm category cache
    if (options.categories) {
      console.log("📁 Warming category cache...");
      await CacheManager.warmCategoryCache();
      console.log("✅ Category cache warmed\n");
    }

    // 3. Warm featured content
    if (options.featuredContent) {
      console.log("⭐ Warming featured content cache...");

      // Featured products
      const featuredProducts = await prisma.product.findMany({
        where: {
          isActive: true,
          isFeatured: true,
        },
        include: {
          images: true,
          variants: {
            include: {
              sizeVariants: true,
            },
          },
          brand: true,
          category: true,
        },
        take: 50,
      });

      for (const product of featuredProducts) {
        await redis.set(`product:${product.id}`, product, 3600);
      }

      // Featured brands
      const featuredBrands = await prisma.brand.findMany({
        where: { isFeatured: true },
        take: 20,
      });

      for (const brand of featuredBrands) {
        await redis.set(`brand:${brand.id}`, brand, 7200); // 2 hour TTL
      }

      console.log(
        `✅ Featured content cached (${featuredProducts.length} products, ${featuredBrands.length} brands)\n`
      );
    }

    // 4. Warm common search queries
    if (options.searchQueries) {
      console.log("🔍 Warming common search queries...");

      const commonQueries = [
        "dress",
        "shoes",
        "bag",
        "jacket",
        "jeans",
        "shirt",
        "accessories",
        "summer",
        "winter",
        "formal",
        "casual",
        "party",
        "work",
        "sport",
      ];

      const searchPromises = commonQueries.map(async (query) => {
        const results = await CacheManager.getCachedSearchResults(query, {
          limit: 20,
        });
        return { query, count: results?.products?.length || 0 };
      });

      const searchResults = await Promise.all(searchPromises);
      const totalCached = searchResults.reduce(
        (sum, result) => sum + result.count,
        0
      );

      console.log(
        `✅ Search queries cached (${commonQueries.length} queries, ${totalCached} total results)\n`
      );
    }

    // 5. Warm brand data
    if (options.brands) {
      console.log("🏷️ Warming brand cache...");

      const brands = await prisma.brand.findMany({
        take: 50,
        orderBy: { name: "asc" },
      });

      for (const brand of brands) {
        await redis.set(`brand:${brand.id}`, brand, 7200); // 2 hour TTL
      }

      console.log(`✅ Brand cache warmed (${brands.length} brands)\n`);
    }

    // 6. Cache homepage data
    console.log("🏠 Warming homepage data...");

    const homepageData = {
      featuredProducts: await prisma.product.findMany({
        where: {
          isActive: true,
          isFeatured: true,
        },
        include: {
          images: { take: 1 },
          brand: { select: { name: true } },
        },
        take: 12,
        orderBy: { createdAt: "desc" },
      }),
      newArrivals: await prisma.product.findMany({
        where: { isActive: true },
        include: {
          images: { take: 1 },
          brand: { select: { name: true } },
        },
        take: 8,
        orderBy: { createdAt: "desc" },
      }),
      featuredBrands: await prisma.brand.findMany({
        where: { isFeatured: true },
        take: 8,
        orderBy: { displayOrder: "asc" },
      }),
    };

    await redis.set("homepage:data", homepageData, 1800); // 30 minute TTL
    console.log("✅ Homepage data cached\n");

    // 7. Cache navigation data
    console.log("🧭 Warming navigation cache...");

    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
        parentId: null, // Top-level categories
      },
      include: {
        children: {
          where: { isActive: true },
          take: 10,
        },
      },
      orderBy: { displayOrder: "asc" },
    });

    await redis.set("navigation:categories", categories, 3600); // 1 hour TTL
    console.log(`✅ Navigation cached (${categories.length} categories)\n`);

    // Get final cache statistics
    const stats = await redis.getStats();
    const duration = Date.now() - startTime;

    console.log("┌─────────────────────────────────────┐");
    console.log("│           CACHE WARMUP SUMMARY     │");
    console.log("├─────────────────────────────────────┤");
    console.log(
      `│ Duration: ${Math.round(duration / 1000)
        .toString()
        .padStart(18)}s │`
    );
    console.log(`│ Keys Created: ${stats.keyCount.toString().padStart(16)} │`);
    console.log(
      `│ Memory Used: ${formatBytes(stats.memoryUsage).padStart(17)} │`
    );
    console.log(`│ Hit Rate: ${stats.hitRate.toFixed(1).padStart(20)}% │`);
    console.log("└─────────────────────────────────────┘");

    console.log("\n✨ Cache warmup completed successfully!");
    console.log("\n📋 What was cached:");
    console.log("├─ 200 most popular products with full details");
    console.log("├─ All active categories with product listings");
    console.log("├─ Featured products and brands");
    console.log("├─ Common search query results");
    console.log("├─ Homepage and navigation data");
    console.log("└─ Brand information and metadata");

    console.log("\n💡 Recommendations:");
    console.log("├─ Run this script after deployments");
    console.log("├─ Schedule regular warmup during off-peak hours");
    console.log("├─ Monitor cache hit rates in the admin dashboard");
    console.log("└─ Adjust TTL values based on content update frequency");
  } catch (error) {
    console.error("❌ Cache warmup failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Handle script execution
if (require.main === module) {
  main().catch((error) => {
    console.error("Script execution failed:", error);
    process.exit(1);
  });
}
