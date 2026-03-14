
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log("--- SYSTEM DATA CHECK ---");
    
    const warehouses = await prisma.warehouse.findMany();
    console.log(`Warehouses found: ${warehouses.length}`);
    for (const w of warehouses) {
      console.log(`🏠 [${w.id}] ${w.name}`);
    }

    const users = await prisma.user.findMany({
      include: { warehouses: true }
    });
    console.log(`\nUsers found: ${users.length}`);
    for (const u of users) {
      console.log(`👤 [${u.id}] ${u.email} | Role: ${u.role}`);
      console.log(`   Linked Warehouses: ${u.warehouses.map(w => w.id).join(", ") || "NONE"}`);
    }

    const products = await prisma.product.findMany({ take: 5 });
    console.log(`\nProducts Sample: ${products.length}`);
    for (const p of products) {
      console.log(`📦 [${p.id}] ${p.name} (Warehouse: ${p.warehouseId})`);
    }

  } catch (err) {
    console.error("❌ Diagnostic error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
