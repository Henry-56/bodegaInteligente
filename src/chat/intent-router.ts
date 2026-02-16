import { parseSpanishDecimal } from "./number-parser";

export type ChatIntent =
  | {
      intent: "SALE";
      products: Array<{ name: string; qty: number; unitPrice?: number }>;
    }
  | { intent: "STOCK_QUERY"; productName: string }
  | { intent: "PROFIT_QUERY"; period: "today" | "week" | "month" }
  | { intent: "DEBT_REGISTER"; debtorName: string; amount: number; note?: string }
  | { intent: "DEBT_PAYMENT"; debtorName: string; amount: number }
  | { intent: "CHAT"; message: string; rawText: string }
  | { intent: "UNKNOWN"; rawText: string };

/**
 * Parse user intent using regex (fallback when Gemini ReAct agent is unavailable).
 * The primary path now uses callGeminiReact in chat.service.ts.
 */
export async function parseIntent(rawText: string): Promise<ChatIntent> {
  return parseIntentRegex(rawText);
}

/**
 * Original regex-based parser (fallback).
 */
export function parseIntentRegex(rawText: string): ChatIntent {
  const text = rawText.trim().toLowerCase();

  // --- SALE patterns ---
  let match = text.match(
    /(?:hoy\s+)?(?:vend[ií]|venta(?:\s+de)?)\s+(\d+[.,]?\d*)\s+(.+?)\s+a\s+(\d+[.,]?\d*)\s*(?:c\/u|cada\s+un[oa]|soles?)?$/
  );
  if (match) {
    return {
      intent: "SALE",
      products: [
        {
          name: match[2].trim(),
          qty: parseSpanishDecimal(match[1]),
          unitPrice: parseSpanishDecimal(match[3]),
        },
      ],
    };
  }

  match = text.match(
    /(?:hoy\s+)?(?:vend[ií]|venta(?:\s+de)?)\s+(\d+[.,]?\d*)\s+(.+?)$/
  );
  if (match) {
    return {
      intent: "SALE",
      products: [
        {
          name: match[2].trim(),
          qty: parseSpanishDecimal(match[1]),
        },
      ],
    };
  }

  // --- STOCK QUERY ---
  match = text.match(
    /(?:stock|inventario|existencia[s]?)\s+(?:de\s+)?(.+)/
  );
  if (match) {
    return { intent: "STOCK_QUERY", productName: match[1].trim() };
  }

  match = text.match(
    /cu[aá]nto[s]?\s+(?:hay|queda[n]?)\s+(?:de\s+)?(.+)/
  );
  if (match) {
    return { intent: "STOCK_QUERY", productName: match[1].trim() };
  }

  // --- PROFIT QUERY ---
  match = text.match(
    /(?:ganancia[s]?|utilidad(?:es)?)\s+(?:de\s+)?(?:la\s+)?semana/
  );
  if (match) {
    return { intent: "PROFIT_QUERY", period: "week" };
  }

  match = text.match(
    /(?:ganancia[s]?|utilidad(?:es)?)\s+(?:de[l]?\s+)?mes/
  );
  if (match) {
    return { intent: "PROFIT_QUERY", period: "month" };
  }

  if (text.includes("ganancia") || text.includes("utilidad")) {
    return { intent: "PROFIT_QUERY", period: "today" };
  }

  // --- DEBT REGISTER (fiado / me debe) ---
  match = text.match(
    /^(.+?)\s+me\s+debe\s+(\d+[.,]?\d*)\s*(?:soles?)?$/
  );
  if (match) {
    return {
      intent: "DEBT_REGISTER",
      debtorName: match[1].trim(),
      amount: parseSpanishDecimal(match[2]),
    };
  }

  match = text.match(
    /^(?:le\s+)?fi[eé]\s+(?:a\s+)?(.+?)\s+(\d+[.,]?\d*)\s*(?:soles?)?$/
  );
  if (match) {
    return {
      intent: "DEBT_REGISTER",
      debtorName: match[1].trim(),
      amount: parseSpanishDecimal(match[2]),
    };
  }

  // --- DEBT PAYMENT ---
  match = text.match(
    /^(.+?)\s+pag[oó]\s+(\d+[.,]?\d*)\s*(?:soles?)?$/
  );
  if (match) {
    return {
      intent: "DEBT_PAYMENT",
      debtorName: match[1].trim(),
      amount: parseSpanishDecimal(match[2]),
    };
  }

  match = text.match(
    /^pag[oó]\s+(.+?)\s+(\d+[.,]?\d*)\s*(?:soles?)?$/
  );
  if (match) {
    return {
      intent: "DEBT_PAYMENT",
      debtorName: match[1].trim(),
      amount: parseSpanishDecimal(match[2]),
    };
  }

  return { intent: "UNKNOWN", rawText };
}
