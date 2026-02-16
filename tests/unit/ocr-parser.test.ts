import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import { parseReceipt } from "@/adapters/ocr/receipt-parser";
import { parseDebtorList } from "@/adapters/ocr/debtor-parser";

describe("Receipt Parser", () => {
  it("parses fixture receipt text", () => {
    const text = readFileSync(
      path.join(__dirname, "../fixtures/ocr-receipt.txt"),
      "utf-8"
    );
    const result = parseReceipt(text);

    expect(result.items.length).toBeGreaterThanOrEqual(3);

    // Check that we found Galleta Oreo
    const galleta = result.items.find((i) =>
      i.productName.toLowerCase().includes("galleta")
    );
    expect(galleta).toBeDefined();
    if (galleta) {
      expect(galleta.qty).toBe(5);
      expect(galleta.unitCost).toBe(1.8);
    }
  });

  it('parses "5 x Galleta Oreo S/.1.80"', () => {
    const result = parseReceipt("5 x Galleta Oreo S/.1.80");
    expect(result.items).toHaveLength(1);
    expect(result.items[0].productName).toContain("Galleta Oreo");
    expect(result.items[0].qty).toBe(5);
    expect(result.items[0].unitCost).toBe(1.8);
  });

  it('parses "3 Gaseosa 2.20"', () => {
    const result = parseReceipt("3 Gaseosa 2.20");
    expect(result.items).toHaveLength(1);
    expect(result.items[0].qty).toBe(3);
    expect(result.items[0].unitCost).toBe(2.2);
  });

  it("handles empty text", () => {
    const result = parseReceipt("");
    expect(result.items).toHaveLength(0);
  });

  it("handles text with no parseable items", () => {
    const result = parseReceipt("BOLETA DE VENTA\nGRACIAS");
    expect(result.items).toHaveLength(0);
    expect(result.unparsedLines.length).toBeGreaterThan(0);
  });
});

describe("Debtor List Parser", () => {
  it("parses fixture debtor text", () => {
    const text = readFileSync(
      path.join(__dirname, "../fixtures/ocr-debtors.txt"),
      "utf-8"
    );
    const result = parseDebtorList(text);

    expect(result.items.length).toBeGreaterThanOrEqual(3);

    const juan = result.items.find((i) =>
      i.debtorName.toLowerCase().includes("juan")
    );
    expect(juan).toBeDefined();
    if (juan) {
      expect(juan.amount).toBe(15.5);
      expect(juan.note).toContain("pan");
    }
  });

  it('parses "Juan Perez 15.50 pan y leche"', () => {
    const result = parseDebtorList("Juan Perez 15.50 pan y leche");
    expect(result.items).toHaveLength(1);
    expect(result.items[0].debtorName).toBe("Juan Perez");
    expect(result.items[0].amount).toBe(15.5);
    expect(result.items[0].note).toBe("pan y leche");
  });

  it('parses "Maria Garcia S/.20.00 arroz"', () => {
    const result = parseDebtorList("Maria Garcia S/.20.00 arroz");
    expect(result.items).toHaveLength(1);
    expect(result.items[0].amount).toBe(20.0);
  });

  it("handles empty text", () => {
    const result = parseDebtorList("");
    expect(result.items).toHaveLength(0);
  });
});
