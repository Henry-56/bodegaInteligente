import { z } from "zod";

export const chatMessageSchema = z.object({
  text: z.string().min(1, "Mensaje requerido").max(500, "Mensaje muy largo"),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
