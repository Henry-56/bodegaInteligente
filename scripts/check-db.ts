
import "dotenv/config";
import { prisma } from "../src/lib/prisma.js";

async function main() {
  console.log("Checking database products...");
  const warehouses = await prisma.warehouse.findMany({
    include: {
      products: {
        include: { inventory: true }
      }
    }
  });

  for (const w of warehouses) {
    console.log(`Warehouse: ${w.id} - ${w.name}`);
    for (const p of w.products) {
      console.log(`  - Product: ${p.id} | ${p.name} | Stock: ${p.inventory?.qtyOnHand || 0}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
