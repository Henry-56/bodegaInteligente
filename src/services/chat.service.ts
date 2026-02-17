import { prisma } from "@/lib/prisma";
import { parseIntent } from "@/chat/intent-router";
import { executeIntent, executeSale, executeStockQuery, executeProfitQuery, executeDebtPayment, executeDebtRegistration } from "@/chat/executor";
import { callGeminiReact, TOOL_TO_INTENT, type ToolHandler, type ImageInput } from "@/chat/gemini";
import { confirmPurchase } from "@/services/inventory.service";
import { formatSoles } from "@/lib/date";

// ── Image helpers ──────────────────────────────────────────────

const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/jpg"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

async function prepareImage(
  file: File,
): Promise<{ image: ImageInput }> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Tipo de imagen no soportado. Usa PNG, JPEG o WebP.");
  }
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("La imagen es muy grande. Máximo 5 MB.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  return {
    image: {
      base64: buffer.toString("base64"),
      mimeType: file.type,
    },
  };
}

// ── Tool handlers ──────────────────────────────────────────────

function createToolHandlers(
  warehouseId: string,
  userId: string,
): Record<string, ToolHandler> {
  return {
    registrar_venta: async (args) => {
      const products = (args.products as Array<Record<string, unknown>>).map(
        (p) => ({
          name: String(p.name ?? ""),
          qty: Number(p.qty) || 1,
          unitPrice: p.unitPrice != null ? Number(p.unitPrice) : undefined,
        }),
      );
      return executeSale({ intent: "SALE", products }, warehouseId, userId);
    },
    consultar_stock: async (args) =>
      executeStockQuery(
        { intent: "STOCK_QUERY", productName: String(args.productName ?? "") },
        warehouseId,
      ),
    consultar_ganancia: async (args) => {
      const period = ["today", "week", "month"].includes(String(args.period))
        ? (String(args.period) as "today" | "week" | "month")
        : "today";
      return executeProfitQuery({ intent: "PROFIT_QUERY", period }, warehouseId);
    },
    registrar_deuda: async (args) =>
      executeDebtRegistration(
        {
          debtorName: String(args.debtorName ?? ""),
          amount: Number(args.amount) || 0,
          note: args.note ? String(args.note) : undefined,
        },
        warehouseId,
      ),
    registrar_pago_deuda: async (args) =>
      executeDebtPayment(
        {
          intent: "DEBT_PAYMENT",
          debtorName: String(args.debtorName ?? ""),
          amount: Number(args.amount) || 0,
        },
        warehouseId,
      ),
    registrar_compra: async (args) => {
      const items = (args.items as Array<Record<string, unknown>>).map((item) => ({
        productName: String(item.productName ?? ""),
        qty: Math.round(Number(item.qty) || 1),
        unitCost: Number(item.unitCost) || 0,
      }));

      if (items.length === 0) {
        return { response: "No se encontraron productos en la boleta.", success: false };
      }

      const result = await confirmPurchase(warehouseId, userId, {
        vendorName: args.vendorName ? String(args.vendorName) : undefined,
        items,
      });

      return {
        response: `Compra registrada: ${result.itemCount} productos, total ${formatSoles(Number(result.total))}`,
        success: true,
        data: result,
      };
    },
  };
}

// ── Main chat handler ──────────────────────────────────────────

export async function interpretChat(
  warehouseId: string,
  userId: string,
  text: string,
  imageFile?: File | null,
  receiptType?: "compra" | "venta",
) {
  let intentName: string;
  let result: { response: string; success: boolean; data?: unknown };
  let toolsUsed: Array<{ tool: string; args: unknown; result: unknown }> = [];

  // Prepare image if provided (in-memory only, no disk write for Vercel compatibility)
  let imageInput: ImageInput | undefined;

  if (imageFile) {
    const prepared = await prepareImage(imageFile);
    imageInput = prepared.image;
  }

  // Build the message — include receiptType context when image is present
  let message = text;
  if (imageInput && !message) {
    message = receiptType === "venta"
      ? "El usuario indica que esta es una BOLETA DE VENTA (salida de productos). Extrae los productos y registra la venta con registrar_venta."
      : "El usuario indica que esta es una BOLETA DE COMPRA (ingreso de mercadería). Extrae los productos y registra la compra con registrar_compra.";
  } else if (imageInput && message) {
    const ctx = receiptType === "venta"
      ? "[El usuario marcó esta imagen como BOLETA DE VENTA (salida)] "
      : "[El usuario marcó esta imagen como BOLETA DE COMPRA (ingreso)] ";
    message = ctx + message;
  }

  if (process.env.GEMINI_API_KEY) {
    // Primary path: ReAct agent (Gemini with tool chaining + vision)
    const agentResult = await callGeminiReact(
      message,
      createToolHandlers(warehouseId, userId),
      imageInput,
    );

    if (agentResult.response || agentResult.toolsUsed.length > 0) {
      const firstTool = agentResult.toolsUsed[0]?.tool;
      intentName = firstTool ? (TOOL_TO_INTENT[firstTool] ?? "CHAT") : "CHAT";
      result = agentResult;
      toolsUsed = agentResult.toolsUsed;
    } else {
      // Agent returned empty → fall back to regex → executor
      const intent = await parseIntent(text);
      result = await executeIntent(intent, warehouseId, userId);
      intentName = intent.intent;
    }
  } else {
    // Fallback: regex parser → executor
    const intent = await parseIntent(text);
    result = await executeIntent(intent, warehouseId, userId);
    intentName = intent.intent;
  }

  // Save chat event
  await prisma.chatEvent.create({
    data: {
      warehouseId,
      userId,
      text: text || "[imagen de boleta]",
      intent: intentName,
      resultJson: JSON.stringify(result),
    },
  });

  return {
    intent: intentName,
    response: result.response,
    success: result.success,
    data: result.data,
    toolsUsed,
  };
}

export async function getChatHistory(warehouseId: string, limit = 50) {
  return prisma.chatEvent.findMany({
    where: { warehouseId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
