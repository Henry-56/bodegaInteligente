import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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
    update: {},
    create: {
      id: "warehouse-demo-001",
      name: "Bodega Don Pepe",
      ownerId: owner.id,
    },
  });

  // Products with initial inventory
  const products = [
    { name: "Galleta Oreo", salePrice: 2.5, qty: 50, cost: 1.8 },
    { name: "Gaseosa Inca Kola 500ml", salePrice: 3.0, qty: 40, cost: 2.2 },
    { name: "Pan de molde Bimbo", salePrice: 7.5, qty: 20, cost: 5.5 },
    { name: "Leche Gloria 400ml", salePrice: 4.5, qty: 30, cost: 3.5 },
    { name: "Arroz Costeño 1kg", salePrice: 5.0, qty: 25, cost: 3.8 },
    { name: "Aceite Primor 1L", salePrice: 9.0, qty: 15, cost: 7.0 },
    { name: "Azúcar Rubia 1kg", salePrice: 4.0, qty: 20, cost: 3.0 },
    { name: "Fideos Don Vittorio", salePrice: 3.5, qty: 35, cost: 2.5 },
    { name: "Atún Florida", salePrice: 5.5, qty: 18, cost: 4.0 },
    { name: "Jabón Bolívar", salePrice: 3.0, qty: 25, cost: 2.0 },
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
