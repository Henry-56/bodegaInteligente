
import "dotenv/config";
import pg from "pg";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("❌ DATABASE_URL not found");
    return;
  }

  const pool = new pg.Pool({ connectionString });
  const client = await pool.connect();

  try {
    console.log("🔍 Checking Database Tables...");
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const tables = res.rows.map(r => r.table_name);
    console.log("Tables found:", tables.join(", "));

    const requiredTables = ["Product", "Inventory", "InventoryMovement", "Sale", "SaleItem", "Purchase", "PurchaseItem", "ChatEvent"];
    for (const table of requiredTables) {
      if (tables.includes(table)) {
        console.log(`✅ Table '${table}' exists.`);
      } else {
        console.error(`❌ Table '${table}' is MISSING!`);
      }
    }

  } catch (err) {
    console.error("❌ Error checking tables:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
