
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
      take: 5,
    });

    console.log("--- LATEST CHAT EVENTS ---");
    for (const event of events) {
      console.log(`\n📅 ${event.createdAt.toISOString()}`);
      console.log(`🤖 Intent: ${event.intent}`);
      console.log(`💬 Text: ${event.text || ""}`);
      const result = event.resultJson ? JSON.parse(event.resultJson) : {};
      console.log(`⚙️ Response: ${result.response}`);
      console.log(`🛠️ Tools Used: ${JSON.stringify(result.toolsUsed || [], null, 2)}`);
      console.log("---------------------------");
    }
  } catch (err) {
    console.error("❌ Error dumping events:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
