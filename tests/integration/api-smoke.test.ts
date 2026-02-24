import { describe, it, expect } from "vitest";
import { createProductSchema, updateProductSchema } from "@/schemas/product.schema";
import { createSaleSchema } from "@/schemas/sale.schema";
import { confirmPurchaseSchema } from "@/schemas/purchase.schema";
import { chatMessageSchema } from "@/schemas/chat.schema";
import { confirmDebtsSchema, paymentSchema } from "@/schemas/debt.schema";

describe("Schema Validation Smoke Tests", () => {
  describe("Product schema", () => {
    it("validates valid product input", () => {
      const result = createProductSchema.safeParse({
        name: "Galleta Oreo",
        salePriceDefault: 2.5,
        initialQty: 10,
        initialCost: 1.8,
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty name", () => {
      const result = createProductSchema.safeParse({
        name: "",
        salePriceDefault: 2.5,
      });
      expect(result.success).toBe(false);
    });

    it("rejects negative price", () => {
      const result = createProductSchema.safeParse({
        name: "Test",
        salePriceDefault: -1,
      });
      expect(result.success).toBe(false);
    });

    it("validates valid update with qtyOnHand", () => {
      const result = updateProductSchema.safeParse({
        name: "Galleta Oreo Editada",
        qtyOnHand: 20,
      });
      expect(result.success).toBe(true);
    });

    it("rejects negative qtyOnHand in update", () => {
      const result = updateProductSchema.safeParse({
        qtyOnHand: -5,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Sale schema", () => {
    it("validates valid sale input", () => {
      const result = createSaleSchema.safeParse({
        items: [
          { productId: "abc123", qty: 5, unitPrice: 2.5 },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty items", () => {
      const result = createSaleSchema.safeParse({
        items: [],
      });
      expect(result.success).toBe(false);
    });

    it("rejects zero quantity", () => {
      const result = createSaleSchema.safeParse({
        items: [{ productId: "abc", qty: 0, unitPrice: 2.5 }],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Purchase schema", () => {
    it("validates valid purchase input", () => {
      const result = confirmPurchaseSchema.safeParse({
        items: [
          { productName: "Galleta Oreo", qty: 10, unitCost: 1.8 },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty items", () => {
      const result = confirmPurchaseSchema.safeParse({
        items: [],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Chat schema", () => {
    it("validates valid chat input", () => {
      const result = chatMessageSchema.safeParse({
        text: "vendí 5 galletas a 2.50",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty text", () => {
      const result = chatMessageSchema.safeParse({
        text: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects text over 500 chars", () => {
      const result = chatMessageSchema.safeParse({
        text: "a".repeat(501),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Debt schema", () => {
    it("validates valid debt confirmation", () => {
      const result = confirmDebtsSchema.safeParse({
        items: [
          { debtorName: "Juan Pérez", amount: 15.5, note: "Pan" },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("validates valid payment", () => {
      const result = paymentSchema.safeParse({
        amount: 10,
      });
      expect(result.success).toBe(true);
    });

    it("rejects zero payment", () => {
      const result = paymentSchema.safeParse({
        amount: 0,
      });
      expect(result.success).toBe(false);
    });
  });
});
