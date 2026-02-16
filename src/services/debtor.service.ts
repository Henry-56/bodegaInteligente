import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { createOcrAdapter } from "@/adapters/ocr/factory";
import { parseDebtorList } from "@/adapters/ocr/debtor-parser";
import type { ConfirmDebtsInput } from "@/schemas/debt.schema";
import type { ParsedDebtorResult } from "@/adapters/ocr/types";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/jpg"];
const MAX_SIZE = 5 * 1024 * 1024;

export async function listDebtors(warehouseId: string) {
  const debtors = await prisma.debtor.findMany({
    where: { warehouseId },
    include: {
      debts: {
        include: { payments: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return debtors.map((d) => {
    let totalDebt = 0;
    let totalPaid = 0;
    for (const debt of d.debts) {
      totalDebt += Number(debt.amount);
      for (const payment of debt.payments) {
        totalPaid += Number(payment.amount);
      }
    }
    return {
      ...d,
      totalDebt,
      totalPaid,
      balance: totalDebt - totalPaid,
    };
  });
}

export async function processDebtUpload(
  file: File
): Promise<{ imagePath: string; ocrResult: ParsedDebtorResult }> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new AppError("INVALID_FILE_TYPE", 400, { allowed: ALLOWED_TYPES });
  }
  if (file.size > MAX_SIZE) {
    throw new AppError("FILE_TOO_LARGE", 400, { maxBytes: MAX_SIZE });
  }

  const uploadDir = process.env.UPLOAD_DIR ?? "./uploads";
  await mkdir(uploadDir, { recursive: true });

  const ext = file.name.split(".").pop() ?? "jpg";
  const filename = `debt_${Date.now()}.${ext}`;
  const filePath = path.join(uploadDir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  try {
    const adapter = createOcrAdapter();
    const rawText = await adapter.extractText(buffer);
    const ocrResult = parseDebtorList(rawText);
    return { imagePath: filePath, ocrResult };
  } catch (error) {
    throw new AppError("OCR_EXTRACTION_FAILED", 502, {
      message: error instanceof Error ? error.message : "OCR failed",
    });
  }
}

export async function confirmDebts(
  warehouseId: string,
  input: ConfirmDebtsInput
) {
  const results: Array<{ debtorName: string; debtId: string }> = [];

  for (const item of input.items) {
    // Upsert debtor
    const debtor = await prisma.debtor.upsert({
      where: {
        warehouseId_name: { warehouseId, name: item.debtorName },
      },
      create: {
        warehouseId,
        name: item.debtorName,
        phone: item.phone ?? null,
      },
      update: {
        phone: item.phone ?? undefined,
      },
    });

    // Create debt
    const debt = await prisma.debt.create({
      data: {
        debtorId: debtor.id,
        amount: item.amount,
        note: item.note ?? null,
        imagePath: input.imagePath ?? null,
        status: "OPEN",
      },
    });

    results.push({ debtorName: debtor.name, debtId: debt.id });
  }

  return results;
}

export async function registerPayment(debtId: string, amount: number) {
  const debt = await prisma.debt.findUnique({
    where: { id: debtId },
    include: { payments: true },
  });

  if (!debt) {
    throw new AppError("DEBT_NOT_FOUND", 404);
  }

  const totalPaid =
    debt.payments.reduce((sum, p) => sum + Number(p.amount), 0) + amount;
  const debtAmount = Number(debt.amount);

  const payment = await prisma.debtPayment.create({
    data: {
      debtId,
      amount,
    },
  });

  // Auto-close if fully paid
  if (totalPaid >= debtAmount) {
    await prisma.debt.update({
      where: { id: debtId },
      data: { status: "PAID" },
    });
  }

  return {
    paymentId: payment.id,
    paid: amount,
    totalPaid,
    debtAmount,
    status: totalPaid >= debtAmount ? "PAID" : "OPEN",
  };
}
