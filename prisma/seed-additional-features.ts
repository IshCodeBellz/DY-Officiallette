import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Adding additional features and sample data...");

  // Get existing test user
  const testUser = await prisma.user.findUnique({
    where: { email: "user@dyofficial.com" },
  });

  if (!testUser) {
    console.log("❌ Test user not found. Please run seed-full-demo.ts first.");
    return;
  }

  // Get some products to work with
  const products = await prisma.product.findMany({
    take: 10,
  });

  if (products.length === 0) {
    console.log("❌ No products found. Please run seed.ts first.");
    return;
  }

  // 1. Create Discount Codes
  console.log("💰 Creating discount codes...");
  
  const discountCodes = [
    {
      code: "WELCOME10",
      kind: "PERCENTAGE",
      percent: 10,
      minSubtotalCents: 5000, // $50
      usageLimit: 100,
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
    {
      code: "FREESHIP",
      kind: "FREE_SHIPPING",
      minSubtotalCents: 7500, // $75
      usageLimit: 500,
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
    },
    {
      code: "SAVE20",
      kind: "FIXED_AMOUNT",
      valueCents: 2000, // $20 in cents
      minSubtotalCents: 10000, // $100
      usageLimit: 50,
      startsAt: new Date(),
      endsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    },
  ];

  for (const discountData of discountCodes) {
    await prisma.discountCode.upsert({
      where: { code: discountData.code },
      update: discountData,
      create: discountData,
    });
  }

  // 2. Create additional users
  console.log("👥 Creating additional users...");
  
  const additionalUsers = [
    {
      email: "sarah@example.com",
      name: "Sarah Johnson",
      password: "password123",
    },
    {
      email: "mike@example.com", 
      name: "Mike Chen",
      password: "password123",
    },
    {
      email: "emma@example.com",
      name: "Emma Davis",
      password: "password123",
    },
  ];

  const createdUsers = [];
  for (const userData of additionalUsers) {
    const hashedPassword = await hash(userData.password, 12);
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        name: userData.name,
        passwordHash: hashedPassword,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });
    createdUsers.push(user);
  }

  // 3. Create Reviews from multiple users
  console.log("⭐ Creating diverse product reviews...");
  
  const reviewData = [
    {
      rating: 5,
      title: "Love this piece!",
      content: "The quality is amazing and fits perfectly. Definitely recommend!",
      isVerified: true,
      authorName: "Sarah Johnson",
      authorEmail: "sarah@example.com",
    },
    {
      rating: 4,
      title: "Great value",
      content: "Good quality for the price. Shipping was fast too.",
      isVerified: true,
      authorName: "Mike Chen",
      authorEmail: "mike@example.com",
    },
    {
      rating: 5,
      title: "Perfect for everyday wear",
      content: "Comfortable and stylish. I've gotten so many compliments!",
      isVerified: false,
      authorName: "Emma Davis",
      authorEmail: "emma@example.com",
    },
    {
      rating: 3,
      title: "Good but runs small",
      content: "Nice product but I had to size up. Material is good quality though.",
      isVerified: true,
      authorName: "Anonymous",
    },
    {
      rating: 4,
      title: "Exactly as pictured",
      content: "Color and style match the photos perfectly. Happy with my purchase.",
      isVerified: true,
      authorName: "Happy Customer",
    },
  ];

  for (let i = 0; i < Math.min(products.length, 8); i++) {
    const product = products[i];
    const review = reviewData[i % reviewData.length];
    const user = [testUser, ...createdUsers][i % (createdUsers.length + 1)];
    
    // Check if review already exists
    const existingReview = await prisma.productReview.findFirst({
      where: {
        productId: product.id,
        authorEmail: review.authorEmail || user.email,
      },
    });

    if (!existingReview) {
      await prisma.productReview.create({
        data: {
          ...review,
          userId: user.id,
          productId: product.id,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  console.log("✅ Additional features seeded successfully!");
  console.log("\n🎯 New Features Added:");
  console.log("💰 Discount Codes:");
  console.log("  - WELCOME10 (10% off for new customers)");
  console.log("  - FREESHIP (Free shipping over $75)");
  console.log("  - SAVE20 ($20 off orders over $100)");
  console.log("👥 Additional Users with Reviews");
  console.log("⭐ Product Reviews from Multiple Users");
  console.log("\n🧪 Test the discount codes at checkout!");
  console.log("🔍 Check /admin/discount-codes to manage them");
  console.log("👀 Product pages now have reviews and ratings");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });