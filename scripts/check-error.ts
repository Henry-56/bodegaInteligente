
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const event = await prisma.chatEvent.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (!event) {
      console.log("No purchase event found.");
      return;
    }

    console.log("📅 Date:", event.createdAt.toISOString());
    console.log("💬 Text:", event.text);
    
    const result = JSON.parse(event.resultJson || "{}");
    console.log("⚙️ Result JSON:", JSON.stringify(result, null, 2));

    if (result.toolsUsed) {
      for (const t of result.toolsUsed) {
        console.log(`\nTool: ${t.tool}`);
        console.log(`Args: ${JSON.stringify(t.args, null, 2)}`);
        console.log(`Result: ${JSON.stringify(t.result, null, 2)}`);
      }
    }
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
