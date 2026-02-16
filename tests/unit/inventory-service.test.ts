import { describe, it, expect } from "vitest";

describe("Inventory Cost Calculation", () => {
  function calculateWeightedAvgCost(
    oldQty: number,
    oldAvg: number,
    addedQty: number,
    unitCost: number
  ): number {
    const newQty = oldQty + addedQty;
    if (newQty === 0) return 0;
    return (oldQty * oldAvg + addedQty * unitCost) / newQty;
  }

  describe("Weighted Average Cost", () => {
    it("calculates correctly for first purchase", () => {
      const result = calculateWeightedAvgCost(0, 0, 10, 5.0);
      expect(result).toBe(5.0);
    });

    it("calculates correctly for subsequent purchase at same price", () => {
      const result = calculateWeightedAvgCost(10, 5.0, 10, 5.0);
      expect(result).toBe(5.0);
    });

    it("calculates correctly for purchase at higher price", () => {
      // Old: 10 units at S/.5.00 = S/.50
      // New: 10 units at S/.7.00 = S/.70
      // Total: 20 units, S/.120 -> avg S/.6.00
      const result = calculateWeightedAvgCost(10, 5.0, 10, 7.0);
      expect(result).toBe(6.0);
    });

    it("calculates correctly for purchase at lower price", () => {
      // Old: 20 units at S/.6.00 = S/.120
      // New: 10 units at S/.3.00 = S/.30
      // Total: 30 units, S/.150 -> avg S/.5.00
      const result = calculateWeightedAvgCost(20, 6.0, 10, 3.0);
      expect(result).toBe(5.0);
    });

    it("handles zero old quantity", () => {
      const result = calculateWeightedAvgCost(0, 0, 5, 3.5);
      expect(result).toBe(3.5);
    });

    it("handles zero added quantity", () => {
      const result = calculateWeightedAvgCost(10, 5.0, 0, 0);
      expect(result).toBe(5.0);
    });
  });

  describe("Profit Calculation", () => {
    function calculateProfit(
      unitPrice: number,
      unitCostSnapshot: number,
      qty: number
    ): number {
      return (unitPrice - unitCostSnapshot) * qty;
    }

    it("calculates positive profit", () => {
      expect(calculateProfit(2.5, 1.8, 5)).toBe(3.5);
    });

    it("calculates zero profit when price equals cost", () => {
      expect(calculateProfit(5.0, 5.0, 10)).toBe(0);
    });

    it("calculates negative profit (loss)", () => {
      expect(calculateProfit(3.0, 5.0, 2)).toBe(-4.0);
    });
  });

  describe("Stock Validation", () => {
    function validateStock(
      qtyOnHand: number,
      requestedQty: number
    ): boolean {
      return qtyOnHand >= requestedQty;
    }

    it("allows sale when sufficient stock", () => {
      expect(validateStock(10, 5)).toBe(true);
    });

    it("allows sale of exact stock", () => {
      expect(validateStock(5, 5)).toBe(true);
    });

    it("blocks sale when insufficient stock", () => {
      expect(validateStock(3, 5)).toBe(false);
    });

    it("blocks sale when zero stock", () => {
      expect(validateStock(0, 1)).toBe(false);
    });
  });
});
