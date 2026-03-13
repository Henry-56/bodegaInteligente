import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Create owner user
  const passwordHash = await bcrypt.hash("Admin123!", 12);
  const owner = await prisma.user.upsert({
    where: { email: "admin@bodega.com" },
    update: {},
    create: {
      email: "admin@bodega.com",
      passwordHash,
      name: "Admin Bodega",
      role: "OWNER",
    },
  });

  // Create warehouse
  const warehouse = await prisma.warehouse.upsert({
    where: { id: "warehouse-demo-001" },
    update: {
      name: "Ladrillera El Progreso",
    },
    create: {
      id: "warehouse-demo-001",
      name: "Ladrillera El Progreso",
      ownerId: owner.id,
    },
  });

  // Products with initial inventory
  const products = [
    { name: "Ladrillo King Kong", salePrice: 1.2, qty: 1000, cost: 0.8 },
    { name: "Ladrillo Pandereta", salePrice: 0.9, qty: 1500, cost: 0.6 },
    { name: "Ladrillo Caravavista", salePrice: 1.5, qty: 800, cost: 1.0 },
  ];

  for (const p of products) {
    const product = await prisma.product.upsert({
      where: {
        warehouseId_name: { warehouseId: warehouse.id, name: p.name },
      },
      update: {},
      create: {
        warehouseId: warehouse.id,
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
  }

  // Create sample debtors
  const debtors = [
    { name: "Juan Pérez", phone: "987654321" },
    { name: "María García", phone: "912345678" },
    { name: "Carlos López", phone: null },
  ];

  for (const d of debtors) {
    const debtor = await prisma.debtor.upsert({
      where: {
        warehouseId_name: { warehouseId: warehouse.id, name: d.name },
      },
      update: {},
      create: {
        warehouseId: warehouse.id,
        name: d.name,
        phone: d.phone,
      },
    });

    // Add sample debt for first debtor
    if (d.name === "Juan Pérez") {
      await prisma.debt.create({
        data: {
          debtorId: debtor.id,
          amount: 15.5,
          note: "Pan y leche",
          status: "OPEN",
        },
      });
    }
  }

  console.log("Seed complete!");
  console.log(`  Owner: admin@bodega.com / Admin123!`);
  console.log(`  Warehouse: ${warehouse.name}`);
  console.log(`  Products: ${products.length}`);
  console.log(`  Debtors: ${debtors.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
