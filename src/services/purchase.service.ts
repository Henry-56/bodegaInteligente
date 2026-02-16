import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { createOcrAdapter } from "@/adapters/ocr/factory";
import { parseReceipt } from "@/adapters/ocr/receipt-parser";
import { AppError } from "@/lib/errors";
import type { ParsedReceiptResult } from "@/adapters/ocr/types";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/jpg"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function processUpload(
  file: File
): Promise<{ imagePath: string; ocrResult: ParsedReceiptResult }> {
  // Validate file
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new AppError("INVALID_FILE_TYPE", 400, {
      allowed: ALLOWED_TYPES,
    });
  }

  if (file.size > MAX_SIZE) {
    throw new AppError("FILE_TOO_LARGE", 400, {
      maxBytes: MAX_SIZE,
    });
  }

  // Save file
  const uploadDir = process.env.UPLOAD_DIR ?? "./uploads";
  await mkdir(uploadDir, { recursive: true });

  const ext = file.name.split(".").pop() ?? "jpg";
  const filename = `purchase_${Date.now()}.${ext}`;
  const filePath = path.join(uploadDir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  // Run OCR
  try {
    const adapter = createOcrAdapter();
    const rawText = await adapter.extractText(buffer);
    const ocrResult = parseReceipt(rawText);

    return { imagePath: filePath, ocrResult };
  } catch (error) {
    throw new AppError("OCR_EXTRACTION_FAILED", 502, {
      message: error instanceof Error ? error.message : "OCR failed",
    });
  }
}
