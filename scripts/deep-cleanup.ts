
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const BRICKS = ["Ladrillo King Kong", "Ladrillo Pandereta", "Ladrillo Caravavista"];

async function main() {
  console.log("🚀 Starting Deep Cleanup...");

  const all = await prisma.product.findMany({ select: { name: true } });
  console.log("All products in DB:", all.map(p => `'${p.name}'`).join(", "));

  // 1. Find the legacy products
  const legacyProducts = await prisma.product.findMany({
    where: {
      NOT: {
        name: { in: BRICKS }
      }
    },
    select: { id: true, name: true }
  });

  if (legacyProducts.length === 0) {
    console.log("✅ No legacy products found. Database is already clean.");
    return;
  }

  console.log(`Found ${legacyProducts.length} legacy products to remove:`);
  legacyProducts.forEach(p => console.log(`  - ${p.name} (${p.id})`));

  const legacyIds = legacyProducts.map(p => p.id);

  // 2. Delete related data in order to satisfy FK constraints
  console.log("Deleting related data...");

  // Delete inventory movements associated with these products
  const mRes = await prisma.inventoryMovement.deleteMany({
    where: { productId: { in: legacyIds } }
  });
  console.log(`  - Deleted ${mRes.count} inventory movements`);

  // Delete inventory records
  const iRes = await prisma.inventory.deleteMany({
    where: { productId: { in: legacyIds } }
  });
  console.log(`  - Deleted ${iRes.count} inventory records`);

  // Delete sale items referencing these products
  const siRes = await prisma.saleItem.deleteMany({
    where: { productId: { in: legacyIds } }
  });
  console.log(`  - Deleted ${siRes.count} sale items`);

  // Delete purchase items referencing these products
  const piRes = await prisma.purchaseItem.deleteMany({
    where: { productNameText: { in: legacyProducts.map(p => p.name) } }
  });
  console.log(`  - Deleted ${piRes.count} purchase items`);

  // 3. Finally delete the products
  const pRes = await prisma.product.deleteMany({
    where: { id: { in: legacyIds } }
  });
  console.log(`✨ Successfully deleted ${pRes.count} products.`);

  // 4. Cleanup empty sales/purchases (optional but clean)
  const emptySales = await prisma.sale.deleteMany({
    where: { items: { none: {} } }
  });
  console.log(`  - Deleted ${emptySales.count} empty sales`);

  const emptyPurchases = await prisma.purchase.deleteMany({
    where: { items: { none: {} } }
  });
  console.log(`  - Deleted ${emptyPurchases.count} empty purchases`);

  console.log("🏁 Cleanup complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
