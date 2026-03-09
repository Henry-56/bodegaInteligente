import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const warehouseId = "warehouse-demo-001";
  const email = "admin@admin.com";

  console.log(`Setting ${email} as owner of ${warehouseId}...`);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`User ${email} not found.`);
    return;
  }

  await prisma.warehouse.update({
    where: { id: warehouseId },
    data: { ownerId: user.id }
  });

  console.log("Success! Ownership transferred.");
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
