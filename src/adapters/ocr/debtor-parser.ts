import type { ParsedDebtorEntry, ParsedDebtorResult } from "./types";
import { parseSpanishDecimal } from "@/chat/number-parser";

export function parseDebtorList(rawText: string): ParsedDebtorResult {
  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const items: ParsedDebtorEntry[] = [];
  const unparsedLines: string[] = [];

  for (const line of lines) {
    const entry = parseLine(line);
    if (entry) {
      items.push(entry);
    } else {
      unparsedLines.push(line);
    }
  }

  return { items, unparsedLines, rawText };
}

function parseLine(line: string): ParsedDebtorEntry | null {
  // Pattern 1: "Juan Perez S/.15.50 pan y leche"
  let match = line.match(
    /^([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+?)\s+[-:]?\s*[sS]\/?\.?\s*(\d+[.,]\d+)\s*[-:]?\s*(.*)$/
  );
  if (match) {
    return buildEntry(match[1], match[2], match[3]);
  }

  // Pattern 2: "Juan Perez - 15.50 - pan"
  match = line.match(
    /^([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+?)\s*[-:]\s*(\d+[.,]\d+)\s*[-:]?\s*(.*)$/
  );
  if (match) {
    return buildEntry(match[1], match[2], match[3]);
  }

  // Pattern 3: "Juan Perez 15.50"
  match = line.match(
    /^([a-zA-ZáéíóúñÁÉÍÓÚÑ\s]+?)\s+(\d+[.,]\d+)\s*(.*)$/
  );
  if (match) {
    return buildEntry(match[1], match[2], match[3]);
  }

  return null;
}

function buildEntry(
  name: string,
  amountStr: string,
  note: string
): ParsedDebtorEntry | null {
  try {
    const amount = parseSpanishDecimal(amountStr);
    const debtorName = name.trim().replace(/\s+/g, " ");

    if (amount <= 0 || debtorName.length < 2) return null;

    return {
      debtorName,
      amount,
      note: note.trim() || null,
    };
  } catch {
    return null;
  }
}
