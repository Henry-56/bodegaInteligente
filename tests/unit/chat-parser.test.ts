import { describe, it, expect } from "vitest";
import { parseIntentRegex as parseIntent } from "@/chat/intent-router";

describe("Chat Intent Router", () => {
  describe("SALE intent", () => {
    it('parses "vendí 5 snacks a 2.5"', () => {
      const result = parseIntent("vendí 5 snacks a 2.5");
      expect(result.intent).toBe("SALE");
      if (result.intent === "SALE") {
        expect(result.products).toHaveLength(1);
        expect(result.products[0].name).toBe("snacks");
        expect(result.products[0].qty).toBe(5);
        expect(result.products[0].unitPrice).toBe(2.5);
      }
    });

    it('parses "hoy vendí 3 galletas a 1.50"', () => {
      const result = parseIntent("hoy vendí 3 galletas a 1.50");
      expect(result.intent).toBe("SALE");
      if (result.intent === "SALE") {
        expect(result.products[0].name).toBe("galletas");
        expect(result.products[0].qty).toBe(3);
        expect(result.products[0].unitPrice).toBe(1.5);
      }
    });

    it('parses "vendí 10 arroz a 5,00" (comma decimal)', () => {
      const result = parseIntent("vendí 10 arroz a 5,00");
      expect(result.intent).toBe("SALE");
      if (result.intent === "SALE") {
        expect(result.products[0].qty).toBe(10);
        expect(result.products[0].unitPrice).toBe(5.0);
      }
    });

    it('parses "vendí 3 galletas" (no price)', () => {
      const result = parseIntent("vendí 3 galletas");
      expect(result.intent).toBe("SALE");
      if (result.intent === "SALE") {
        expect(result.products[0].name).toBe("galletas");
        expect(result.products[0].qty).toBe(3);
        expect(result.products[0].unitPrice).toBeUndefined();
      }
    });

    it('parses "vendi 5 leche a 4.5" (without accent)', () => {
      const result = parseIntent("vendi 5 leche a 4.5");
      expect(result.intent).toBe("SALE");
      if (result.intent === "SALE") {
        expect(result.products[0].name).toBe("leche");
        expect(result.products[0].qty).toBe(5);
        expect(result.products[0].unitPrice).toBe(4.5);
      }
    });
  });

  describe("STOCK_QUERY intent", () => {
    it('parses "stock de galletas"', () => {
      const result = parseIntent("stock de galletas");
      expect(result.intent).toBe("STOCK_QUERY");
      if (result.intent === "STOCK_QUERY") {
        expect(result.productName).toBe("galletas");
      }
    });

    it('parses "inventario de arroz"', () => {
      const result = parseIntent("inventario de arroz");
      expect(result.intent).toBe("STOCK_QUERY");
      if (result.intent === "STOCK_QUERY") {
        expect(result.productName).toBe("arroz");
      }
    });

    it('parses "cuánto hay de leche"', () => {
      const result = parseIntent("cuánto hay de leche");
      expect(result.intent).toBe("STOCK_QUERY");
      if (result.intent === "STOCK_QUERY") {
        expect(result.productName).toBe("leche");
      }
    });
  });

  describe("PROFIT_QUERY intent", () => {
    it('parses "ganancia hoy"', () => {
      const result = parseIntent("ganancia hoy");
      expect(result.intent).toBe("PROFIT_QUERY");
      if (result.intent === "PROFIT_QUERY") {
        expect(result.period).toBe("today");
      }
    });

    it('parses "ganancias de la semana"', () => {
      const result = parseIntent("ganancias de la semana");
      expect(result.intent).toBe("PROFIT_QUERY");
      if (result.intent === "PROFIT_QUERY") {
        expect(result.period).toBe("week");
      }
    });

    it('parses "utilidad del mes"', () => {
      const result = parseIntent("utilidad del mes");
      expect(result.intent).toBe("PROFIT_QUERY");
      if (result.intent === "PROFIT_QUERY") {
        expect(result.period).toBe("month");
      }
    });
  });

  describe("DEBT_PAYMENT intent", () => {
    it('parses "Juan pagó 10"', () => {
      const result = parseIntent("Juan pagó 10");
      expect(result.intent).toBe("DEBT_PAYMENT");
      if (result.intent === "DEBT_PAYMENT") {
        expect(result.debtorName).toBe("juan");
        expect(result.amount).toBe(10);
      }
    });

    it('parses "Maria pago 15.50 soles"', () => {
      const result = parseIntent("Maria pago 15.50 soles");
      expect(result.intent).toBe("DEBT_PAYMENT");
      if (result.intent === "DEBT_PAYMENT") {
        expect(result.debtorName).toBe("maria");
        expect(result.amount).toBe(15.5);
      }
    });
  });

  describe("UNKNOWN intent", () => {
    it("returns UNKNOWN for unrecognized text", () => {
      const result = parseIntent("hola mundo");
      expect(result.intent).toBe("UNKNOWN");
    });

    it("returns UNKNOWN for empty-ish text", () => {
      const result = parseIntent("???");
      expect(result.intent).toBe("UNKNOWN");
    });
  });
});
