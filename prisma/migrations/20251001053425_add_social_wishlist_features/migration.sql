-- AlterTable
ALTER TABLE "WishlistItem" ADD COLUMN "notes" TEXT;

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "hexColor" TEXT,
    "priceCents" INTEGER,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WishlistFollower" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "wishlistId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WishlistFollower_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WishlistFollower_wishlistId_fkey" FOREIGN KEY ("wishlistId") REFERENCES "Wishlist" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "userId" TEXT,
    "authorName" TEXT NOT NULL,
    "authorEmail" TEXT,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "helpfulVotes" INTEGER NOT NULL DEFAULT 0,
    "totalVotes" INTEGER NOT NULL DEFAULT 0,
    "images" TEXT,
    "adminResponse" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProductReview_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductBundle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "discountPercent" INTEGER,
    "discountCents" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" DATETIME,
    "validTo" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProductRelation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "relatedProductId" TEXT NOT NULL,
    "relationType" TEXT NOT NULL,
    "weight" REAL NOT NULL DEFAULT 1.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProductRelation_relatedProductId_fkey" FOREIGN KEY ("relatedProductId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProductRelation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserBehavior" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "productId" TEXT,
    "categoryId" TEXT,
    "searchQuery" TEXT,
    "metadata" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    CONSTRAINT "UserBehavior_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "UserBehavior_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SearchIndex" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "keywords" TEXT NOT NULL,
    "brandName" TEXT,
    "categoryName" TEXT,
    "tags" TEXT,
    "priceRange" TEXT NOT NULL,
    "colors" TEXT,
    "sizes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "InventoryAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT,
    "variantId" TEXT,
    "alertType" TEXT NOT NULL,
    "threshold" INTEGER,
    "currentStock" INTEGER,
    "message" TEXT NOT NULL,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "productId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "score" REAL NOT NULL,
    "metadata" TEXT,
    "validUntil" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WishlistAnalytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "wishlistId" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "conversionCount" INTEGER NOT NULL DEFAULT 0,
    "lastViewedAt" DATETIME,
    "lastSharedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SearchCache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "query" TEXT NOT NULL,
    "results" TEXT NOT NULL,
    "facets" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ReviewAnalytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "averageRating" REAL NOT NULL DEFAULT 0,
    "ratingCounts" TEXT NOT NULL,
    "helpfulVotes" INTEGER NOT NULL DEFAULT 0,
    "lastReviewAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "_BundleItems" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_BundleItems_A_fkey" FOREIGN KEY ("A") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_BundleItems_B_fkey" FOREIGN KEY ("B") REFERENCES "ProductBundle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_BundleProducts" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_BundleProducts_A_fkey" FOREIGN KEY ("A") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_BundleProducts_B_fkey" FOREIGN KEY ("B") REFERENCES "ProductBundle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CartLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cartId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "size" TEXT,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "priceCentsSnapshot" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CartLine_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CartLine_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CartLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CartLine" ("cartId", "createdAt", "id", "priceCentsSnapshot", "productId", "qty", "size", "updatedAt") SELECT "cartId", "createdAt", "id", "priceCentsSnapshot", "productId", "qty", "size", "updatedAt" FROM "CartLine";
DROP TABLE "CartLine";
ALTER TABLE "new_CartLine" RENAME TO "CartLine";
CREATE INDEX "CartLine_productId_idx" ON "CartLine"("productId");
CREATE INDEX "CartLine_variantId_idx" ON "CartLine"("variantId");
CREATE UNIQUE INDEX "CartLine_cartId_productId_variantId_size_key" ON "CartLine"("cartId", "productId", "variantId", "size");
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "shortDescription" TEXT,
    "priceCents" INTEGER NOT NULL,
    "comparePriceCents" INTEGER,
    "brandId" TEXT,
    "categoryId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "weight" REAL,
    "dimensions" TEXT,
    "materials" TEXT,
    "careInstructions" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "tags" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("brandId", "categoryId", "createdAt", "deletedAt", "description", "id", "name", "priceCents", "sku", "updatedAt") SELECT "brandId", "categoryId", "createdAt", "deletedAt", "description", "id", "name", "priceCents", "sku", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");
CREATE INDEX "Product_brandId_idx" ON "Product"("brandId");
CREATE INDEX "Product_deletedAt_idx" ON "Product"("deletedAt");
CREATE INDEX "Product_isActive_idx" ON "Product"("isActive");
CREATE INDEX "Product_isFeatured_idx" ON "Product"("isFeatured");
CREATE TABLE "new_ProductImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "imageType" TEXT NOT NULL DEFAULT 'gallery',
    "variantId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ProductImage" ("alt", "createdAt", "id", "position", "productId", "updatedAt", "url") SELECT "alt", "createdAt", "id", "position", "productId", "updatedAt", "url" FROM "ProductImage";
DROP TABLE "ProductImage";
ALTER TABLE "new_ProductImage" RENAME TO "ProductImage";
CREATE INDEX "ProductImage_productId_idx" ON "ProductImage"("productId");
CREATE INDEX "ProductImage_variantId_idx" ON "ProductImage"("variantId");
CREATE INDEX "ProductImage_imageType_idx" ON "ProductImage"("imageType");
CREATE TABLE "new_Wishlist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "name" TEXT DEFAULT 'My Wishlist',
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "shareToken" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Wishlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Wishlist" ("createdAt", "id", "updatedAt", "userId") SELECT "createdAt", "id", "updatedAt", "userId" FROM "Wishlist";
DROP TABLE "Wishlist";
ALTER TABLE "new_Wishlist" RENAME TO "Wishlist";
CREATE UNIQUE INDEX "Wishlist_userId_key" ON "Wishlist"("userId");
CREATE UNIQUE INDEX "Wishlist_shareToken_key" ON "Wishlist"("shareToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");

-- CreateIndex
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");

-- CreateIndex
CREATE INDEX "ProductVariant_type_idx" ON "ProductVariant"("type");

-- CreateIndex
CREATE INDEX "ProductVariant_stock_idx" ON "ProductVariant"("stock");

-- CreateIndex
CREATE INDEX "ProductVariant_isActive_idx" ON "ProductVariant"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_productId_type_value_key" ON "ProductVariant"("productId", "type", "value");

-- CreateIndex
CREATE INDEX "WishlistFollower_wishlistId_idx" ON "WishlistFollower"("wishlistId");

-- CreateIndex
CREATE INDEX "WishlistFollower_userId_idx" ON "WishlistFollower"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WishlistFollower_wishlistId_userId_key" ON "WishlistFollower"("wishlistId", "userId");

-- CreateIndex
CREATE INDEX "ProductReview_productId_idx" ON "ProductReview"("productId");

-- CreateIndex
CREATE INDEX "ProductReview_userId_idx" ON "ProductReview"("userId");

-- CreateIndex
CREATE INDEX "ProductReview_rating_idx" ON "ProductReview"("rating");

-- CreateIndex
CREATE INDEX "ProductReview_isPublished_idx" ON "ProductReview"("isPublished");

-- CreateIndex
CREATE INDEX "ProductReview_createdAt_idx" ON "ProductReview"("createdAt");

-- CreateIndex
CREATE INDEX "ProductBundle_isActive_idx" ON "ProductBundle"("isActive");

-- CreateIndex
CREATE INDEX "ProductBundle_validFrom_idx" ON "ProductBundle"("validFrom");

-- CreateIndex
CREATE INDEX "ProductBundle_validTo_idx" ON "ProductBundle"("validTo");

-- CreateIndex
CREATE INDEX "ProductRelation_productId_idx" ON "ProductRelation"("productId");

-- CreateIndex
CREATE INDEX "ProductRelation_relatedProductId_idx" ON "ProductRelation"("relatedProductId");

-- CreateIndex
CREATE INDEX "ProductRelation_relationType_idx" ON "ProductRelation"("relationType");

-- CreateIndex
CREATE UNIQUE INDEX "ProductRelation_productId_relatedProductId_relationType_key" ON "ProductRelation"("productId", "relatedProductId", "relationType");

-- CreateIndex
CREATE INDEX "UserBehavior_userId_idx" ON "UserBehavior"("userId");

-- CreateIndex
CREATE INDEX "UserBehavior_sessionId_idx" ON "UserBehavior"("sessionId");

-- CreateIndex
CREATE INDEX "UserBehavior_eventType_idx" ON "UserBehavior"("eventType");

-- CreateIndex
CREATE INDEX "UserBehavior_productId_idx" ON "UserBehavior"("productId");

-- CreateIndex
CREATE INDEX "UserBehavior_timestamp_idx" ON "UserBehavior"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "SearchIndex_productId_key" ON "SearchIndex"("productId");

-- CreateIndex
CREATE INDEX "SearchIndex_title_idx" ON "SearchIndex"("title");

-- CreateIndex
CREATE INDEX "SearchIndex_brandName_idx" ON "SearchIndex"("brandName");

-- CreateIndex
CREATE INDEX "SearchIndex_categoryName_idx" ON "SearchIndex"("categoryName");

-- CreateIndex
CREATE INDEX "SearchIndex_priceRange_idx" ON "SearchIndex"("priceRange");

-- CreateIndex
CREATE INDEX "SearchIndex_isActive_idx" ON "SearchIndex"("isActive");

-- CreateIndex
CREATE INDEX "InventoryAlert_productId_idx" ON "InventoryAlert"("productId");

-- CreateIndex
CREATE INDEX "InventoryAlert_variantId_idx" ON "InventoryAlert"("variantId");

-- CreateIndex
CREATE INDEX "InventoryAlert_alertType_idx" ON "InventoryAlert"("alertType");

-- CreateIndex
CREATE INDEX "InventoryAlert_isResolved_idx" ON "InventoryAlert"("isResolved");

-- CreateIndex
CREATE INDEX "InventoryAlert_createdAt_idx" ON "InventoryAlert"("createdAt");

-- CreateIndex
CREATE INDEX "Recommendation_userId_idx" ON "Recommendation"("userId");

-- CreateIndex
CREATE INDEX "Recommendation_productId_idx" ON "Recommendation"("productId");

-- CreateIndex
CREATE INDEX "Recommendation_type_idx" ON "Recommendation"("type");

-- CreateIndex
CREATE INDEX "Recommendation_score_idx" ON "Recommendation"("score");

-- CreateIndex
CREATE INDEX "Recommendation_validUntil_idx" ON "Recommendation"("validUntil");

-- CreateIndex
CREATE UNIQUE INDEX "Recommendation_userId_productId_type_key" ON "Recommendation"("userId", "productId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "WishlistAnalytics_wishlistId_key" ON "WishlistAnalytics"("wishlistId");

-- CreateIndex
CREATE INDEX "WishlistAnalytics_wishlistId_idx" ON "WishlistAnalytics"("wishlistId");

-- CreateIndex
CREATE INDEX "WishlistAnalytics_lastViewedAt_idx" ON "WishlistAnalytics"("lastViewedAt");

-- CreateIndex
CREATE UNIQUE INDEX "SearchCache_query_key" ON "SearchCache"("query");

-- CreateIndex
CREATE INDEX "SearchCache_query_idx" ON "SearchCache"("query");

-- CreateIndex
CREATE INDEX "SearchCache_expiresAt_idx" ON "SearchCache"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewAnalytics_productId_key" ON "ReviewAnalytics"("productId");

-- CreateIndex
CREATE INDEX "ReviewAnalytics_productId_idx" ON "ReviewAnalytics"("productId");

-- CreateIndex
CREATE INDEX "ReviewAnalytics_averageRating_idx" ON "ReviewAnalytics"("averageRating");

-- CreateIndex
CREATE INDEX "ReviewAnalytics_lastReviewAt_idx" ON "ReviewAnalytics"("lastReviewAt");

-- CreateIndex
CREATE UNIQUE INDEX "_BundleItems_AB_unique" ON "_BundleItems"("A", "B");

-- CreateIndex
CREATE INDEX "_BundleItems_B_index" ON "_BundleItems"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_BundleProducts_AB_unique" ON "_BundleProducts"("A", "B");

-- CreateIndex
CREATE INDEX "_BundleProducts_B_index" ON "_BundleProducts"("B");
