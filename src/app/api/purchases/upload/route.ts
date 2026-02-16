import { withAuth } from "@/lib/errors";
import { ok, error } from "@/lib/api-response";
import { processUpload } from "@/services/purchase.service";

export const POST = withAuth(async (req, { session }) => {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return error("NO_FILE_PROVIDED", 400);
  }

  const result = await processUpload(file);

  return ok({
    imagePath: result.imagePath,
    items: result.ocrResult.items,
    unparsedLines: result.ocrResult.unparsedLines,
    rawText: result.ocrResult.rawText,
  });
});
