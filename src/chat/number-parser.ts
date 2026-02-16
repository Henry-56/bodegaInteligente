export function parseSpanishDecimal(str: string): number {
  let cleaned = str.replace(/\s/g, "");

  const hasDot = cleaned.includes(".");
  const hasComma = cleaned.includes(",");

  if (hasDot && hasComma) {
    // "1.250,00" -> European: dot=thousands, comma=decimal
    // "1,250.00" -> US: comma=thousands, dot=decimal
    if (cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")) {
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      cleaned = cleaned.replace(/,/g, "");
    }
  } else if (hasComma) {
    // "2,50" -> 2.50
    cleaned = cleaned.replace(",", ".");
  }

  const result = parseFloat(cleaned);
  if (isNaN(result)) {
    throw new Error(`Formato numérico inválido: ${str}`);
  }
  return result;
}
