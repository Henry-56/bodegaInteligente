import type { ParsedReceiptItem, ParsedReceiptResult } from "./types";
import { parseSpanishDecimal } from "@/chat/number-parser";

export function parseReceipt(rawText: string): ParsedReceiptResult {
  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const items: ParsedReceiptItem[] = [];
  const unparsedLines: string[] = [];

  for (const line of lines) {
    const item = parseLine(line);
    if (item) {
      items.push(item);
    } else {
      unparsedLines.push(line);
    }
  }

  return { items, unparsedLines, rawText };
}

function parseLine(line: string): ParsedReceiptItem | null {
  // Pattern 1: "5 x Galleta Oreo S/.2.50" or "5x Galleta 2.50"
  let match = line.match(
    /^(\d+[.,]?\d*)\s*[xX]\s+(.+?)\s+[sS]?\/?\.?\s*(\d+[.,]\d+)\s*$/
  );
  if (match) {
    return buildItem(match[2], match[1], match[3]);
  }

  // Pattern 2: "Galleta Oreo x5 S/.2.50"
  match = line.match(
    /^(.+?)\s+[xX]\s*(\d+[.,]?\d*)\s+[sS]?\/?\.?\s*(\d+[.,]\d+)\s*$/
  );
  if (match) {
    return buildItem(match[1], match[2], match[3]);
  }

  // Pattern 3: "5 Galleta Oreo 2.50"
  match = line.match(
    /^(\d+[.,]?\d*)\s+(.+?)\s+[sS]?\/?\.?\s*(\d+[.,]\d+)\s*$/
  );
  if (match) {
    return buildItem(match[2], match[1], match[3]);
  }

  // Pattern 4: "Galleta Oreo 5 2.50" (name qty cost)
  match = line.match(
    /^([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+?)\s+(\d+[.,]?\d*)\s+[sS]?\/?\.?\s*(\d+[.,]\d+)\s*$/
  );
  if (match) {
    return buildItem(match[1], match[2], match[3]);
  }

  // Pattern 5: loose — extract all numbers + text
  const numbers = line.match(/\d+[.,]?\d*/g);
  const text = line
    .replace(/\d+[.,]?\d*/g, "")
    .replace(/[sS]\/?\.?/g, "")
    .replace(/[xX]/g, "")
    .trim();

  if (numbers && numbers.length >= 2 && text.length > 1) {
    return buildItem(text, numbers[0], numbers[numbers.length - 1]);
  }

  return null;
}

function buildItem(
  name: string,
  qtyStr: string,
  costStr: string
): ParsedReceiptItem | null {
  try {
    const qty = parseSpanishDecimal(qtyStr);
    const unitCost = parseSpanishDecimal(costStr);
    const productName = name.trim().replace(/\s+/g, " ");

    if (qty <= 0 || unitCost <= 0 || productName.length === 0) return null;

    return {
      productName,
      qty: Math.round(qty),
      unitCost,
    };
  } catch {
    return null;
  }
}
