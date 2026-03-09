import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const warehouseId = "warehouse-demo-001";
  const emails = ["admin@admin.com", "admin@bodega.com"];

  console.log(`Linking users to warehouse: ${warehouseId}...`);

  // Check if warehouse exists
  const warehouse = await prisma.warehouse.findUnique({
    where: { id: warehouseId }
  });

  if (!warehouse) {
    console.error(`Error: Warehouse ${warehouseId} not found.`);
    process.exit(1);
  }

  for (const email of emails) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { warehouses: true }
    });

    if (user) {
      const alreadyLinked = user.warehouses.some(w => w.id === warehouseId);
      if (alreadyLinked) {
        console.log(`User ${email} is already linked to ${warehouseId}.`);
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            warehouses: {
              connect: { id: warehouseId }
            }
          }
        });
        console.log(`Successfully linked ${email} to ${warehouseId}.`);
      }
    } else {
      console.log(`User ${email} not found, skipping.`);
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
