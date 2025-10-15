import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("🔍 Checking available tables...");

    // Get all tables in the public schema
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `;

    console.log("\n📋 Available tables:");
    tables.forEach((table, index) => {
      console.log(`${index + 1}. ${table.tablename}`);
    });

    // Also check for specific tables we're interested in
    const expectedTables = [
      "Product",
      "Order",
      "User",
      "Brand",
      "Category",
      "Shipment",
    ];

    console.log("\n🔎 Checking specific table existence:");
    for (const tableName of expectedTables) {
      try {
        const result = await prisma.$queryRaw`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = ${tableName}
          );
        `;
        console.log(
          `${tableName}: ${result[0]?.exists ? "✅ exists" : "❌ not found"}`
        );

        // Also try lowercase version
        const lowerResult = await prisma.$queryRaw`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = ${tableName.toLowerCase()}
          );
        `;
        console.log(
          `${tableName.toLowerCase()}: ${
            lowerResult[0]?.exists ? "✅ exists" : "❌ not found"
          }`
        );
      } catch (error) {
        console.log(`${tableName}: ❌ error checking`);
      }
    }
  } catch (error) {
    console.error("❌ Error checking tables:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
