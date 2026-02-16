import type { OcrAdapter } from "./types";
import { TesseractAdapter } from "./tesseract.adapter";
import { ApiOcrAdapter } from "./api.adapter";

let instance: OcrAdapter | null = null;

export function createOcrAdapter(): OcrAdapter {
  if (instance) return instance;

  const provider = process.env.OCR_PROVIDER ?? "local";

  if (provider === "api") {
    instance = new ApiOcrAdapter();
  } else {
    instance = new TesseractAdapter();
  }

  return instance;
}
