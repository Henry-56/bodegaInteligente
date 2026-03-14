
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const warehouseId = "warehouse-progreso-001";

  console.log(`🌱 Seeding warehouse [${warehouseId}]...`);

  try {
    const products = [
      { name: "Ladrillo King Kong", salePrice: 1.2, qty: 1000, cost: 0.8 },
      { name: "Ladrillo Pandereta", salePrice: 0.9, qty: 1500, cost: 0.6 },
      { name: "Ladrillo Caravavista", salePrice: 1.5, qty: 800, cost: 1.0 },
    ];

    for (const p of products) {
      const product = await prisma.product.upsert({
        where: {
          warehouseId_name: { warehouseId, name: p.name },
        },
        update: {},
        create: {
          warehouseId,
          name: p.name,
          salePriceDefault: p.salePrice,
        },
      });

      await prisma.inventory.upsert({
        where: { productId: product.id },
        update: {},
        create: {
          productId: product.id,
          qtyOnHand: p.qty,
          avgUnitCost: p.cost,
        },
      });
      console.log(` - Created/Updated ${p.name}`);
    }

    console.log("✨ Seeding complete!");

  } catch (err) {
    console.error("❌ Seeding failed:", err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
