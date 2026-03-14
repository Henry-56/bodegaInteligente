
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const events = await prisma.chatEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
    });

    console.log("--- LATEST CHAT EVENTS (NEON) ---");
    for (const event of events) {
      console.log(`\n📅 ${event.createdAt.toISOString()}`);
      console.log(`👤 UserID: ${event.userId}`);
      console.log(`🏠 WarehouseID: ${event.warehouseId}`);
      console.log(`🤖 Intent: ${event.intent}`);
      console.log(`💬 Text Snippet: ${event.text?.substring(0, 50)}...`);
      
      try {
        const result = event.resultJson ? JSON.parse(event.resultJson) : {};
        console.log(`🛠️ Tools: ${JSON.stringify(result.toolsUsed || [], null, 2)}`);
        console.log(`⚙️ Final Response: ${result.response}`);
      } catch (e) {
        console.log("❌ Result JSON Error:", event.resultJson);
      }
      console.log("---------------------------");
    }
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
