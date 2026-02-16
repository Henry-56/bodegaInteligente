import { describe, it, expect } from "vitest";
import { normalizeProductName, levenshtein } from "@/lib/utils";

describe("normalizeProductName", () => {
  it("lowercases and trims", () => {
    expect(normalizeProductName("  Galleta Oreo  ")).toBe("galleta oreo");
  });

  it("collapses multiple spaces", () => {
    expect(normalizeProductName("Pan  de   molde")).toBe("pan de molde");
  });

  it("removes accents", () => {
    expect(normalizeProductName("Azúcar Rubia")).toBe("azucar rubia");
  });

  it("handles empty string", () => {
    expect(normalizeProductName("")).toBe("");
  });
});

describe("levenshtein", () => {
  it("returns 0 for identical strings", () => {
    expect(levenshtein("galleta", "galleta")).toBe(0);
  });

  it("returns correct distance for single edit", () => {
    expect(levenshtein("galleta", "galeta")).toBe(1);
  });

  it("returns correct distance for different strings", () => {
    expect(levenshtein("arroz", "azucar")).toBeGreaterThan(3);
  });

  it("handles empty strings", () => {
    expect(levenshtein("", "hello")).toBe(5);
    expect(levenshtein("hello", "")).toBe(5);
    expect(levenshtein("", "")).toBe(0);
  });

  it("is symmetric", () => {
    expect(levenshtein("abc", "xyz")).toBe(levenshtein("xyz", "abc"));
  });
});

describe("Product Matching (functional)", () => {
  const products = [
    "galleta oreo",
    "gaseosa inca kola 500ml",
    "pan de molde bimbo",
    "leche gloria 400ml",
    "arroz costeno 1kg",
  ];

  it("exact match", () => {
    const input = normalizeProductName("Galleta Oreo");
    const found = products.find((p) => p === input);
    expect(found).toBe("galleta oreo");
  });

  it("contains match", () => {
    const input = normalizeProductName("oreo");
    const found = products.find(
      (p) => p.includes(input) || input.includes(p)
    );
    expect(found).toBe("galleta oreo");
  });

  it("fuzzy match for typo", () => {
    const input = normalizeProductName("galeta oreo");
    const threshold = 0.3;

    let bestMatch: string | null = null;
    let bestRatio = Infinity;

    for (const p of products) {
      const dist = levenshtein(input, p);
      const maxLen = Math.max(input.length, p.length);
      const ratio = dist / maxLen;
      if (ratio < threshold && ratio < bestRatio) {
        bestRatio = ratio;
        bestMatch = p;
      }
    }

    expect(bestMatch).toBe("galleta oreo");
  });

  it("no match for unrelated product", () => {
    const input = normalizeProductName("cerveza");
    const threshold = 0.3;

    let bestMatch: string | null = null;
    let bestRatio = Infinity;

    for (const p of products) {
      const dist = levenshtein(input, p);
      const maxLen = Math.max(input.length, p.length);
      const ratio = dist / maxLen;
      if (ratio < threshold && ratio < bestRatio) {
        bestRatio = ratio;
        bestMatch = p;
      }
    }

    expect(bestMatch).toBeNull();
  });
});
