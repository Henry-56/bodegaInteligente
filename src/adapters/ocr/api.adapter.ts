import type { OcrAdapter } from "./types";
import { AppError } from "@/lib/errors";

export class ApiOcrAdapter implements OcrAdapter {
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    this.apiUrl = process.env.OCR_API_URL ?? "";
    this.apiKey = process.env.OCR_API_KEY ?? "";
    if (!this.apiUrl || !this.apiKey) {
      throw new AppError("OCR_NOT_CONFIGURED", 500, {
        message: "OCR_API_URL y OCR_API_KEY son requeridos para OCR_PROVIDER=api",
      });
    }
  }

  async extractText(imageBuffer: Buffer): Promise<string> {
    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/octet-stream",
      },
      body: new Uint8Array(imageBuffer),
    });

    if (!response.ok) {
      throw new AppError("OCR_EXTRACTION_FAILED", 502, {
        provider: "api",
        status: response.status,
      });
    }

    const result = await response.json();
    return result.text ?? "";
  }
}
