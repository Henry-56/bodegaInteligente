import type { OcrAdapter } from "./types";

export class TesseractAdapter implements OcrAdapter {
  async extractText(imageBuffer: Buffer): Promise<string> {
    const Tesseract = await import("tesseract.js");
    const worker = await Tesseract.createWorker("spa");
    try {
      const {
        data: { text },
      } = await worker.recognize(imageBuffer);
      return text;
    } finally {
      await worker.terminate();
    }
  }
}
