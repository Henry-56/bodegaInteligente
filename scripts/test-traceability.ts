import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { confirmPurchase, recordSale, getInventoryHistory } from "../src/services/inventory.service";

async function main() {
  console.log("Starting traceability test...");

  const warehouseId = "warehouse-demo-001"; // From seed
  const userId = (await prisma.user.findFirst({ where: { email: "admin@bodega.com" } }))?.id;

  if (!userId) {
    throw new Error("Admin user not found. Please run seed first.");
  }

  // 1. Find a product
  const product = await prisma.product.findFirst({
    where: { warehouseId, name: "Ladrillo King Kong" },
  });

  if (!product) {
    throw new Error("Product 'Ladrillo King Kong' not found. Please run seed first.");
  }

  console.log(`Testing with product: ${product.name} (ID: ${product.id})`);

  // 2. Clear previous movements for this product (to have a clean test)
  await prisma.inventoryMovement.deleteMany({ where: { productId: product.id } });

  // 3. Confirm a purchase
  console.log("\n--- Recording a Purchase ---");
  const purchaseResult = await confirmPurchase(warehouseId, userId, {
    vendorName: "Proveedor Bricks S.A.",
    items: [
      {
        productName: product.name,
        qty: 500,
        unitCost: 0.85,
      },
    ],
  });
  console.log("Purchase confirmed:", purchaseResult);

  // 4. Record a sale
  console.log("\n--- Recording a Sale ---");
  const saleResult = await recordSale(warehouseId, userId, [
    {
      productId: product.id,
      qty: 200,
      unitPrice: 1.25,
    },
  ]);
  console.log("Sale recorded:", saleResult.saleId);

  // 5. Verify History
  console.log("\n--- Verifying Inventory History ---");
  const history = await getInventoryHistory(warehouseId, product.id);
  console.log(`Found ${history.length} movements:`);
  
  history.forEach((m, i) => {
    console.log(`${i+1}. Type: ${m.type}, Qty: ${m.qty}, UnitCost: ${m.unitCost}, Total: ${m.total}`);
    if (m.purchaseItem) console.log(`   Source: Purchase from ${m.purchaseItem.purchase.vendorName}`);
    if (m.saleItem) console.log(`   Source: Sale at ${m.saleItem.sale.soldAt}`);
  });

  if (history.length !== 2) {
    throw new Error(`Expected 2 movements, found ${history.length}`);
  }

  if (history[0].type !== "SALE" || history[1].type !== "PURCHASE") {
    throw new Error("Movement sequence or types are incorrect (expected SALE then PURCHASE in desc order)");
  }

  console.log("\n✅ Traceability test passed!");
}

main()
  .catch((e) => {
    console.error("❌ Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
