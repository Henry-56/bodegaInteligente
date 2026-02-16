export interface OcrAdapter {
  extractText(imageBuffer: Buffer): Promise<string>;
}

export interface ParsedReceiptItem {
  productName: string;
  qty: number;
  unitCost: number;
}

export interface ParsedReceiptResult {
  items: ParsedReceiptItem[];
  unparsedLines: string[];
  rawText: string;
}

export interface ParsedDebtorEntry {
  debtorName: string;
  amount: number;
  note: string | null;
}

export interface ParsedDebtorResult {
  items: ParsedDebtorEntry[];
  unparsedLines: string[];
  rawText: string;
}
