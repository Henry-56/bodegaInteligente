
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🏪 ABSOLUTE WAREHOUSE LIST");
  const warehouses = await prisma.warehouse.findMany({
    include: {
      products: {
        include: { inventory: true }
      },
      owner: true
    }
  });

  console.log(`Total warehouses found: ${warehouses.length}`);

  for (const w of warehouses) {
    console.log(`\n🏠 [${w.id}] ${w.name}`);
    console.log(`   Owner: ${w.owner?.email || "UNKNOWN"}`);
    console.log(`   Products count: ${w.products.length}`);
    for (const p of w.products) {
      console.log(`      - ${p.name} (ID: ${p.id})`);
    }
  }

  console.log("\n👤 ALL USERS");
  const users = await prisma.user.findMany();
  for (const u of users) {
    console.log(`   - ${u.email} (ID: ${u.id})`);
  }

  console.log("\n✅ Done.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
