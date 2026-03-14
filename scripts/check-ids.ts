
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const warehouseId = "warehouse-demo-001";
  const userId = "cmlph5pgv0000vsz4fxblzm7j";

  try {
    const w = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
    const u = await prisma.user.findUnique({ where: { id: userId } });
    
    console.log(`Warehouse [${warehouseId}] found: ${!!w}`);
    if (w) console.log(`  Name: ${w.name}`);
    
    console.log(`User [${userId}] found: ${!!u}`);
    if (u) console.log(`  Email: ${u.email}`);

    const allU = await prisma.user.findMany();
    console.log("\nAll Users:");
    allU.forEach(x => console.log(` - ${x.id} (${x.email}) - ${x.name}`));

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
