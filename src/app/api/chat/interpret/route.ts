import { withAuth } from "@/lib/errors";
import { ok } from "@/lib/api-response";
import { chatMessageSchema } from "@/schemas/chat.schema";
import { interpretChat } from "@/services/chat.service";

export const POST = withAuth(async (req, { session }) => {
  const contentType = req.headers.get("content-type") ?? "";

  let text: string;
  let imageFile: File | null = null;
  let receiptType: "compra" | "venta" | undefined;

  if (contentType.includes("multipart/form-data")) {
    // FormData: text + optional image + optional receiptType
    const formData = await req.formData();
    const rawText = (formData.get("text") as string) || "";
    const file = formData.get("image") as File | null;
    const rawType = (formData.get("receiptType") as string) || "";

    // Text is optional when image is present
    if (!rawText && !file) {
      return ok({ response: "Envía un mensaje o una imagen.", success: false });
    }

    text = rawText;
    imageFile = file && file.size > 0 ? file : null;
    if (rawType === "compra" || rawType === "venta") {
      receiptType = rawType;
    }
  } else {
    // JSON: text only
    const body = await req.json();
    text = chatMessageSchema.parse(body).text;
  }

  const result = await interpretChat(
    session.warehouseId,
    session.userId,
    text,
    imageFile,
    receiptType,
  );
  return ok(result);
});
