import { describe, it, expect } from "vitest";
import { parseSpanishDecimal } from "@/chat/number-parser";

describe("parseSpanishDecimal", () => {
  it('parses "2.50"', () => {
    expect(parseSpanishDecimal("2.50")).toBe(2.5);
  });

  it('parses "2,50" (comma decimal)', () => {
    expect(parseSpanishDecimal("2,50")).toBe(2.5);
  });

  it('parses "1.250,00" (European format)', () => {
    expect(parseSpanishDecimal("1.250,00")).toBe(1250);
  });

  it('parses "1,250.00" (US format)', () => {
    expect(parseSpanishDecimal("1,250.00")).toBe(1250);
  });

  it('parses "10" (integer)', () => {
    expect(parseSpanishDecimal("10")).toBe(10);
  });

  it('parses "0.5"', () => {
    expect(parseSpanishDecimal("0.5")).toBe(0.5);
  });

  it('parses "100"', () => {
    expect(parseSpanishDecimal("100")).toBe(100);
  });

  it("throws on invalid input", () => {
    expect(() => parseSpanishDecimal("abc")).toThrow();
  });

  it('parses " 3.50 " with whitespace', () => {
    expect(parseSpanishDecimal(" 3.50 ")).toBe(3.5);
  });
});
