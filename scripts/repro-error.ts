
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { confirmPurchase } from "../src/services/inventory.service.js";

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prismaClient = new PrismaClient({ adapter });

  // Use the IDs from the check-db output
  const warehouseId = "cmmp6q1is0001lcnav4bezeze";
  const userId = "cmmp6px9q0000lcnasf9m3pqr";

  const input = {
    vendorName: "Construcciones S.A.C.",
    items: [
      { productName: "Ladrillo Caravavista", qty: 1500, unitCost: 1.50 },
      { productName: "Ladrillo King Kong", qty: 2000, unitCost: 1.40 },
      { productName: "Ladrillo Pandereta", qty: 3000, unitCost: 0.70 }
    ]
  };

  console.log("🚀 Attempting to reproduce purchase registration...");
  
  try {
    const result = await confirmPurchase(warehouseId, userId, input);
    console.log("✅ SUCCESS:", JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("❌ FAILED with error:");
    console.error(err);
    if (err instanceof Error) {
      console.error("Stack trace:", err.stack);
    }
  } finally {
    await prismaClient.$disconnect();
  }
}

main();
