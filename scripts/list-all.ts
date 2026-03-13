
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🔍 Deep Database Analysis");

  const users = await prisma.user.findMany({
    include: {
      warehouses: {
        include: {
          products: {
            include: { inventory: true }
          }
        }
      }
    }
  });

  console.log(`Found ${users.length} users.`);

  for (const user of users) {
    console.log(`\n👤 User: ${user.email} (ID: ${user.id})`);
    console.log(`   Warehouses: ${user.warehouses.length}`);

    for (const w of user.warehouses) {
      console.log(`   🏠 Warehouse: ${w.name} (ID: ${w.id})`);
      console.log(`      Products: ${w.products.length}`);
      
      for (const p of w.products) {
        console.log(`      - [${p.id}] ${p.name} | Stock: ${p.inventory?.qtyOnHand || 0}`);
      }
    }
  }

  // Also check products not associated with these users (if any)
  const allProducts = await prisma.product.findMany();
  const associatedIds = users.flatMap(u => u.warehouses.flatMap(w => w.products.map(p => p.id)));
  const strayProducts = allProducts.filter(p => !associatedIds.includes(p.id));

  if (strayProducts.length > 0) {
    console.log(`\n⚠️ Found ${strayProducts.length} stray products (not linked to listed users):`);
    for (const p of strayProducts) {
      console.log(`   - [${p.id}] ${p.name} (Warehouse ID: ${p.warehouseId})`);
    }
  }

  console.log("\n✅ Analysis complete.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
