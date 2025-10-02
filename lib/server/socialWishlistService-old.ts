import { prisma } from "./prisma";
import { cache } from "react";

export interface CreateWishlistData {
  userId: string;
  name?: string;
  description?: string;
  isPublic?: boolean;
}

export interface WishlistItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  priceCents: number;
  addedAt: Date;
  isAvailable: boolean;
  notes?: string;
}

export interface SocialWishlist {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  name: string;
  description?: string;
  isPublic: boolean;
  shareToken?: string;
  items: WishlistItem[];
  followerCount: number;
  totalValue: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WishlistAnalytics {
  totalWishlists: number;
  totalItems: number;
  averageItemsPerWishlist: number;
  mostWishlistedProducts: Array<{
    productId: string;
    productName: string;
    wishlistCount: number;
  }>;
  conversionRate: number; // Items moved from wishlist to cart
}

// Cached functions for performance
const getCachedUserWishlists = cache(async (userId: string) => {
  return await prisma.wishlist.findMany({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: true,
            },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
});

const getCachedPublicWishlists = cache(async () => {
  return await prisma.wishlist.findMany({
    where: { isPublic: true },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: true,
            },
          },
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }],
  });
});

/**
 * Enhanced Social Wishlist Service with Real Database Integration
 */
export class SocialWishlistService {
  /**
   * Create a new wishlist
   */
  static async createWishlist(
    data: CreateWishlistData
  ): Promise<{ success: boolean; wishlist?: SocialWishlist; error?: string }> {
    try {
      // Check if user already has a wishlist with this name
      const existingWishlist = await prisma.wishlist.findFirst({
        where: {
          userId: data.userId,
          name: data.name || "My Wishlist",
        },
      });

      if (existingWishlist) {
        return {
          success: false,
          error: "You already have a wishlist with this name",
        };
      }

      // Generate share token if public
      const shareToken = data.isPublic ? this.generateShareToken() : null;

      // Create wishlist in database
      const wishlist = await prisma.wishlist.create({
        data: {
          userId: data.userId,
          name: data.name || "My Wishlist",
          description: data.description,
          isPublic: data.isPublic || false,
          shareToken,
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: { take: 1, orderBy: { position: "asc" } },
                },
              },
            },
          },
        },
      });

      const transformedWishlist = this.transformWishlist(wishlist);
      return { success: true, wishlist: transformedWishlist };
    } catch (error) {
      console.error("Create wishlist error:", error);
      return { success: false, error: "Failed to create wishlist" };
    }
  }

  /**
   * Transform Prisma wishlist to SocialWishlist interface
   */
  private static transformWishlist(wishlist: any): SocialWishlist {
    return {
      id: wishlist.id,
      userId: wishlist.userId || "",
      userName: wishlist.user?.name || "Anonymous",
      userAvatar: `/avatars/${wishlist.user?.name?.toLowerCase()}.jpg`,
      name: wishlist.name || "My Wishlist",
      description: wishlist.description || undefined,
      isPublic: wishlist.isPublic,
      shareToken: wishlist.shareToken || undefined,
      items: wishlist.items.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        productImage: item.product.images[0]?.url || "/placeholder.svg",
        priceCents: item.product.priceCents,
        addedAt: item.createdAt,
        isAvailable: (item.product as any).isActive ?? true,
        notes: (item as any).notes || undefined,
      })),
      followerCount: wishlist.followers?.length || 0,
      totalValue: wishlist.items.reduce(
        (sum: number, item: any) => sum + item.product.priceCents,
        0
      ),
      createdAt: wishlist.createdAt,
      updatedAt: wishlist.updatedAt,
    };
  }

  /**
   * Add item to wishlist
   */
  static async addToWishlist(
    userId: string,
    productId: string,
    wishlistId?: string,
    notes?: string
  ): Promise<{ success: boolean; item?: WishlistItem; error?: string }> {
    try {
      // Get or create default wishlist if none specified
      let targetWishlistId = wishlistId;
      if (!targetWishlistId) {
        let defaultWishlist = await prisma.wishlist.findFirst({
          where: { userId, name: "My Wishlist" },
        });

        if (!defaultWishlist) {
          const createResult = await this.createWishlist({ userId });
          if (!createResult.success || !createResult.wishlist) {
            return {
              success: false,
              error: "Failed to create default wishlist",
            };
          }
          targetWishlistId = createResult.wishlist.id;
        } else {
          targetWishlistId = defaultWishlist.id;
        }
      }

      // Check if item already in wishlist
      const existingItem = await prisma.wishlistItem.findFirst({
        where: {
          wishlistId: targetWishlistId,
          productId,
        },
      });

      if (existingItem) {
        return { success: false, error: "Item already in wishlist" };
      }

      // Verify product exists and get product data
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          images: { take: 1, orderBy: { position: "asc" } },
        },
      });

      if (!product) {
        return { success: false, error: "Product not found" };
      }

      // Create wishlist item
      const wishlistItem = await prisma.wishlistItem.create({
        data: {
          wishlistId: targetWishlistId,
          productId,
          ...(notes && { notes }),
        },
        include: {
          product: {
            include: {
              images: { take: 1, orderBy: { position: "asc" } },
            },
          },
        },
      });

      // Update wishlist timestamp
      await prisma.wishlist.update({
        where: { id: targetWishlistId },
        data: { updatedAt: new Date() },
      });

      // Track analytics
      await this.trackWishlistEvent(userId, productId, "add");

      const transformedItem: WishlistItem = {
        id: wishlistItem.id,
        productId: wishlistItem.productId,
        productName: product.name,
        productImage: product.images[0]?.url || "/placeholder.svg",
        priceCents: product.priceCents,
        addedAt: wishlistItem.createdAt,
        isAvailable: (product as any).isActive ?? true,
        notes: (wishlistItem as any).notes || undefined,
      };

      return { success: true, item: transformedItem };
    } catch (error) {
      console.error("Add to wishlist error:", error);
      return { success: false, error: "Failed to add item to wishlist" };
    }
  }

  /**
   * Remove item from wishlist
   */
  static async removeFromWishlist(
    userId: string,
    itemId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Find and verify ownership of the wishlist item
      const wishlistItem = await prisma.wishlistItem.findFirst({
        where: {
          id: itemId,
          wishlist: { userId },
        },
        include: { wishlist: true },
      });

      if (!wishlistItem) {
        return { success: false, error: "Item not found or access denied" };
      }

      // Delete the wishlist item
      await prisma.wishlistItem.delete({
        where: { id: itemId },
      });

      // Update wishlist timestamp
      await prisma.wishlist.update({
        where: { id: wishlistItem.wishlistId },
        data: { updatedAt: new Date() },
      });

      // Track analytics
      await this.trackWishlistEvent(userId, wishlistItem.productId, "remove");

      return { success: true };
    } catch (error) {
      console.error("Remove from wishlist error:", error);
      return { success: false, error: "Failed to remove item from wishlist" };
    }
  }

  /**
   * Get user's wishlists
   */
  static async getUserWishlists(userId: string): Promise<SocialWishlist[]> {
    try {
      const wishlists = await getCachedUserWishlists(userId);
      return wishlists.map((wishlist) => this.transformWishlist(wishlist));
    } catch (error) {
      console.error("Get user wishlists error:", error);
      return [];
    }
  }

  /**
   * Get public wishlist by share token
   */
  static async getPublicWishlist(
    shareToken: string
  ): Promise<SocialWishlist | null> {
    try {
      // Mock public wishlist
      if (shareToken === "share_abc123") {
        return {
          id: "wishlist_public_1",
          userId: "user_123",
          userName: "Fashion Lover",
          userAvatar: "/avatars/fashionlover.jpg",
          name: "My Fashion Finds",
          description: "Curated collection of my favorite fashion items",
          isPublic: true,
          shareToken,
          items: [
            {
              id: "item_p1",
              productId: "prod_3",
              productName: "Designer Dress",
              productImage: "/images/dress-1.jpg",
              priceCents: 8999,
              addedAt: new Date(Date.now() - 86400000),
              isAvailable: true,
              notes: "Perfect for special occasions",
            },
            {
              id: "item_p2",
              productId: "prod_4",
              productName: "Luxury Handbag",
              productImage: "/images/handbag-1.jpg",
              priceCents: 15999,
              addedAt: new Date(Date.now() - 172800000),
              isAvailable: false,
              notes: "Currently out of stock",
            },
          ],
          followerCount: 156,
          totalValue: 24998,
          createdAt: new Date(Date.now() - 1209600000),
          updatedAt: new Date(),
        };
      }

      return null;
    } catch (error) {
      console.error("Get public wishlist error:", error);
      return null;
    }
  }

  /**
   * Follow a public wishlist
   */
  static async followWishlist(
    userId: string,
    wishlistId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if wishlist is public
      const wishlist = await this.getWishlistById(wishlistId);
      if (!wishlist || !wishlist.isPublic) {
        return { success: false, error: "Wishlist not found or not public" };
      }

      // Check if already following
      const isFollowing = await this.isUserFollowingWishlist(
        userId,
        wishlistId
      );
      if (isFollowing) {
        return { success: false, error: "Already following this wishlist" };
      }

      console.log("User following wishlist:", { userId, wishlistId });
      return { success: true };
    } catch (error) {
      console.error("Follow wishlist error:", error);
      return { success: false, error: "Failed to follow wishlist" };
    }
  }

  /**
   * Get trending public wishlists
   */
  static async getTrendingWishlists(
    limit: number = 10
  ): Promise<SocialWishlist[]> {
    try {
      // Mock trending wishlists
      return [
        {
          id: "trending_1",
          userId: "influencer_1",
          userName: "StyleGuru",
          userAvatar: "/avatars/styleguru.jpg",
          name: "Fall Fashion Must-Haves",
          description: "Essential pieces for fall 2025",
          isPublic: true,
          shareToken: "share_trending1",
          items: [],
          followerCount: 1250,
          totalValue: 45000,
          createdAt: new Date(Date.now() - 604800000),
          updatedAt: new Date(),
        },
        {
          id: "trending_2",
          userId: "influencer_2",
          userName: "MinimalChic",
          userAvatar: "/avatars/minimalchic.jpg",
          name: "Minimalist Wardrobe",
          description: "Quality over quantity - capsule wardrobe essentials",
          isPublic: true,
          shareToken: "share_trending2",
          items: [],
          followerCount: 890,
          totalValue: 32000,
          createdAt: new Date(Date.now() - 1209600000),
          updatedAt: new Date(),
        },
      ].slice(0, limit);
    } catch (error) {
      console.error("Get trending wishlists error:", error);
      return [];
    }
  }

  /**
   * Generate wishlist analytics
   */
  static async getWishlistAnalytics(): Promise<WishlistAnalytics> {
    try {
      // Mock analytics
      return {
        totalWishlists: 15420,
        totalItems: 89350,
        averageItemsPerWishlist: 5.8,
        mostWishlistedProducts: [
          {
            productId: "prod_1",
            productName: "Premium Cotton T-Shirt",
            wishlistCount: 1250,
          },
          {
            productId: "prod_2",
            productName: "Designer Jeans",
            wishlistCount: 980,
          },
          {
            productId: "prod_3",
            productName: "Casual Sneakers",
            wishlistCount: 875,
          },
        ],
        conversionRate: 23.5, // 23.5% of wishlist items eventually get purchased
      };
    } catch (error) {
      console.error("Get wishlist analytics error:", error);
      throw error;
    }
  }

  /**
   * Move items from wishlist to cart
   */
  static async moveToCart(
    userId: string,
    itemIds: string[]
  ): Promise<{
    success: boolean;
    movedCount?: number;
    failedItems?: string[];
    error?: string;
  }> {
    try {
      let movedCount = 0;
      const failedItems: string[] = [];

      for (const itemId of itemIds) {
        const hasAccess = await this.userHasAccessToItem(userId, itemId);
        if (hasAccess) {
          // Mock move to cart
          console.log("Item moved to cart:", { userId, itemId });
          movedCount++;
        } else {
          failedItems.push(itemId);
        }
      }

      return {
        success: true,
        movedCount,
        failedItems: failedItems.length > 0 ? failedItems : undefined,
      };
    } catch (error) {
      console.error("Move to cart error:", error);
      return { success: false, error: "Failed to move items to cart" };
    }
  }

  /**
   * Private helper methods
   */
  private static generateShareToken(): string {
    return "share_" + Math.random().toString(36).substring(2, 15);
  }

  private static async getUserWishlistByName(
    userId: string,
    name: string
  ): Promise<SocialWishlist | null> {
    // Mock check
    if (userId === "existing_user" && name === "My Wishlist") {
      return {} as SocialWishlist; // Simplified mock
    }
    return null;
  }

  private static async getUserDefaultWishlist(
    userId: string
  ): Promise<SocialWishlist | null> {
    const wishlists = await this.getUserWishlists(userId);
    return (
      wishlists.find((w) => w.name === "My Wishlist") || wishlists[0] || null
    );
  }

  private static async getWishlistItem(
    wishlistId: string,
    productId: string
  ): Promise<WishlistItem | null> {
    // Mock check
    if (
      wishlistId === "existing_wishlist" &&
      productId === "existing_product"
    ) {
      return {} as WishlistItem;
    }
    return null;
  }

  private static async userHasAccessToItem(
    userId: string,
    itemId: string
  ): Promise<boolean> {
    // Mock access check
    return true;
  }

  private static async trackWishlistEvent(
    userId: string,
    productId: string,
    action: string
  ): Promise<void> {
    console.log("Wishlist event tracked:", {
      userId,
      productId,
      action,
      timestamp: new Date(),
    });
  }

  private static async getWishlistById(
    wishlistId: string
  ): Promise<SocialWishlist | null> {
    if (wishlistId === "wishlist_public_1") {
      return await this.getPublicWishlist("share_abc123");
    }
    return null;
  }

  private static async isUserFollowingWishlist(
    userId: string,
    wishlistId: string
  ): Promise<boolean> {
    // Mock following check
    return userId === "following_user" && wishlistId === "wishlist_1";
  }

  /**
   * Admin interface methods
   */
  async getRecentActivity() {
    // Mock recent social activity - in production, this would query activity logs
    return {
      wishlists: [
        {
          userName: "Sarah M.",
          action: "created",
          wishlistName: "Summer Essentials",
          timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 min ago
        },
        {
          userName: "Mike C.",
          action: "shared",
          wishlistName: "Workout Gear",
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
        },
        {
          userName: "Alex R.",
          action: "followed",
          wishlistName: "Fashion Finds",
          timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 min ago
        },
      ],
      reviews: [
        {
          userName: "Emma T.",
          action: "reviewed",
          rating: 5,
          timestamp: new Date(Date.now() - 1000 * 60 * 10), // 10 min ago
        },
        {
          userName: "John D.",
          action: "reviewed",
          rating: 4,
          timestamp: new Date(Date.now() - 1000 * 60 * 25), // 25 min ago
        },
        {
          userName: "Lisa K.",
          action: "reviewed",
          rating: 3,
          timestamp: new Date(Date.now() - 1000 * 60 * 40), // 40 min ago
        },
      ],
    };
  }
}
