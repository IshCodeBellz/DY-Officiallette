import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const brandNames = ["Nova", "Axis", "Prime", "Zen", "Core"];
  const categoryDefs = [
    { slug: "women", name: "Women" },
    { slug: "men", name: "Men" },
    { slug: "clothing", name: "Clothing" },
    { slug: "shoes", name: "Shoes" },
    { slug: "accessories", name: "Accessories" },
    { slug: "sportswear", name: "Sportswear" },
  ];

  const brands = await Promise.all(
    brandNames.map((name) =>
      prisma.brand.upsert({ where: { name }, update: {}, create: { name } })
    )
  );
  const categories = await Promise.all(
    categoryDefs.map((c) =>
      prisma.category.upsert({
        where: { slug: c.slug },
        update: { name: c.name },
        create: { slug: c.slug, name: c.name },
      })
    )
  );

  // Skip if products already exist
  const existingCount = await prisma.product.count();
  if (existingCount > 0) {
    console.log(`Products already seeded: ${existingCount}`);
    return;
  }

  const sizes = ["XS", "S", "M", "L", "XL"];
  const total = 120;
  for (let i = 0; i < total; i++) {
    const brand = brands[i % brands.length];
    const category = categories[i % categories.length];
    const price = Math.round((Math.random() * 90 + 10) * 100); // cents
    const product = await prisma.product.create({
      data: {
        sku: `SKU-${i + 1}`,
        name: `Product ${i + 1}`,
        description:
          "Generated product description for demo purposes. Replace with rich copy.",
        priceCents: price,
        brandId: brand.id,
        categoryId: category.id,
        images: {
          create: [
            {
              url: `https://picsum.photos/seed/prod-${i}-1/900/1200`,
              position: 0,
              alt: `Product ${i + 1} image 1`,
            },
            {
              url: `https://picsum.photos/seed/prod-${i}-2/900/1200`,
              position: 1,
              alt: `Product ${i + 1} image 2`,
            },
          ],
        },
        sizes: {
          create: sizes.slice(0, (i % sizes.length) + 1).map((label) => ({
            label,
            stock: 25 + ((i + label.length) % 50),
          })),
        },
      },
    });
    if ((i + 1) % 25 === 0) console.log(`Created ${i + 1}/${total} products`);
  }
  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
