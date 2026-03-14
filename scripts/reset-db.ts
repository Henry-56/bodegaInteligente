
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("🔥 Starting total database reset...");

  try {
    // 1. Delete transactional data
    console.log(" - Clearing events and movements...");
    await prisma.chatEvent.deleteMany();
    await prisma.inventoryMovement.deleteMany();

    console.log(" - Clearing purchase/sale items...");
    await prisma.saleItem.deleteMany();
    await prisma.purchaseItem.deleteMany();

    console.log(" - Clearing sales and purchases...");
    await prisma.sale.deleteMany();
    await prisma.purchase.deleteMany();

    console.log(" - Clearing inventory and products...");
    await prisma.inventory.deleteMany();
    await prisma.product.deleteMany();

    console.log(" - Clearing debts and debtors...");
    await prisma.debtPayment.deleteMany();
    await prisma.debt.deleteMany();
    await prisma.debtor.deleteMany();

    // 2. Delete structural data
    console.log(" - Clearing warehouses and users...");
    await prisma.warehouse.deleteMany();
    await prisma.user.deleteMany();

    console.log("✅ Database cleared.");

    // 3. Create NEW Admin
    console.log("\n👤 Creating new Admin...");
    const passwordHash = await bcrypt.hash("Admin123!", 12);
    const newAdmin = await prisma.user.create({
      data: {
        email: "admin@progreso.com",
        passwordHash,
        name: "Admin Progreso",
        role: "OWNER",
      }
    });

    console.log("🏠 Creating main warehouse...");
    const warehouse = await prisma.warehouse.create({
      data: {
        id: "warehouse-progreso-001",
        name: "Ladrillera El Progreso",
        ownerId: newAdmin.id,
      }
    });

    console.log("\n✨ RESET COMPLETE!");
    console.log(`Email: admin@progreso.com`);
    console.log(`Password: Admin123!`);
    console.log(`Warehouse ID: ${warehouse.id}`);

  } catch (err) {
    console.error("❌ Reset failed:", err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
