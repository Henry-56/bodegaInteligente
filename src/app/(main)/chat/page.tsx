"use client";

import { useState, useRef, useEffect, type FormEvent, type ChangeEvent } from "react";
import Button from "@/components/ui/Button";

interface ToolUsed {
  tool: string;
  args: unknown;
  result: unknown;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  imageUrl?: string;
  result?: {
    intent: string;
    message: string;
    data?: unknown;
  };
  toolsUsed?: ToolUsed[];
  timestamp: Date;
}

const TOOL_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  registrar_venta: {
    label: "Venta",
    icon: "\uD83D\uDED2",
    color: "bg-green-100 text-green-700 border-green-200",
  },
  consultar_stock: {
    label: "Stock",
    icon: "\uD83D\uDCE6",
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  consultar_ganancia: {
    label: "Ganancia",
    icon: "\uD83D\uDCCA",
    color: "bg-purple-100 text-purple-700 border-purple-200",
  },
  registrar_deuda: {
    label: "Deuda",
    icon: "\uD83D\uDCDD",
    color: "bg-red-100 text-red-700 border-red-200",
  },
  registrar_pago_deuda: {
    label: "Pago deuda",
    icon: "\uD83D\uDCB0",
    color: "bg-amber-100 text-amber-700 border-amber-200",
  },
  registrar_compra: {
    label: "Compra",
    icon: "\uD83D\uDDCE\uFE0F",
    color: "bg-orange-100 text-orange-700 border-orange-200",
  },
};

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [receiptType, setReceiptType] = useState<"compra" | "venta">("compra");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleImageSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  }

  function clearImage() {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setReceiptType("compra");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if ((!text && !imageFile) || sending) return;

    // Add user message with optional image preview
    const typeLabel = imageFile
      ? receiptType === "compra" ? "Boleta de compra" : "Boleta de venta"
      : "";
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: text || typeLabel || "(imagen de boleta)",
      imageUrl: imagePreview ?? undefined,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    // Keep references before clearing
    const currentImage = imageFile;
    const currentReceiptType = receiptType;

    // Clear image preview (but keep references for sending)
    setImageFile(null);
    setImagePreview(null);
    setReceiptType("compra");
    if (fileInputRef.current) fileInputRef.current.value = "";

    try {
      let res: Response;

      if (currentImage) {
        // Send as FormData with image + receipt type
        const formData = new FormData();
        formData.append("text", text);
        formData.append("image", currentImage);
        formData.append("receiptType", currentReceiptType);
        res = await fetch("/api/chat/interpret", {
          method: "POST",
          credentials: "include",
          body: formData,
        });
      } else {
        // Send as JSON (text only)
        res = await fetch("/api/chat/interpret", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
      }

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `Error ${res.status}`);
      }

      const json = await res.json();
      const data = json.data;

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: data.response ?? "Operacion completada",
        result: {
          intent: data.intent,
          message: data.response,
          data: data.data,
        },
        toolsUsed: data.toolsUsed ?? [],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        text:
          err instanceof Error
            ? `Error: ${err.message}`
            : "Ocurrio un error inesperado",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="flex h-full flex-col">
      <h1 className="mb-4 text-2xl font-bold text-gray-900">Chat</h1>

      {/* Chat window */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-gray-400">
              <svg
                className="mb-3 h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p className="text-sm">
                Escriba un mensaje para gestionar su bodega
              </p>
              <p className="mt-1 text-xs text-gray-300">
                Ej: &quot;Vender 2 arroz a 5.50&quot; o suba una foto de
                boleta
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2.5 ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {/* Tools usadas (solo asistente) */}
                    {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        {msg.toolsUsed.map((t, i) => {
                          const info = TOOL_LABELS[t.tool];
                          const toolResult = t.result as { success?: boolean } | null;
                          return (
                            <span
                              key={i}
                              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${
                                info?.color ?? "bg-gray-100 text-gray-600 border-gray-200"
                              }`}
                            >
                              <span>{info?.icon ?? "\u2699\uFE0F"}</span>
                              {info?.label ?? t.tool}
                              {toolResult?.success === true && (
                                <span className="text-green-500">{"\u2713"}</span>
                              )}
                              {toolResult?.success === false && (
                                <span className="text-red-500">{"\u2717"}</span>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    )}
                    {/* Imagen adjunta (usuario) */}
                    {msg.imageUrl && (
                      <img
                        src={msg.imageUrl}
                        alt="Boleta adjunta"
                        className="mb-2 max-h-48 rounded-md object-contain"
                      />
                    )}
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      {msg.timestamp.toLocaleTimeString("es-PE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}

              {sending && (
                <div className="flex justify-start">
                  <div className="rounded-lg bg-gray-100 px-4 py-3">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Image preview + receipt type selector */}
        {imagePreview && (
          <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <img
                src={imagePreview}
                alt="Vista previa"
                className="h-16 w-16 flex-shrink-0 rounded-md border border-gray-200 object-cover"
              />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-700">
                    {imageFile?.name}{" "}
                    <span className="text-gray-400">
                      {imageFile ? `(${(imageFile.size / 1024).toFixed(0)} KB)` : ""}
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={clearImage}
                    className="rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                    aria-label="Quitar imagen"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
                {/* Receipt type toggle */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setReceiptType("compra")}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      receiptType === "compra"
                        ? "bg-orange-100 text-orange-700 ring-1 ring-orange-300"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    Compra (ingreso)
                  </button>
                  <button
                    type="button"
                    onClick={() => setReceiptType("venta")}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      receiptType === "venta"
                        ? "bg-green-100 text-green-700 ring-1 ring-green-300"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    Venta (salida)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Input area */}
        <div className="border-t border-gray-200 p-4">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            {/* Image upload button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleImageSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
              className="flex-shrink-0 rounded-lg border border-gray-300 p-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50"
              title="Subir imagen de boleta"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
                />
              </svg>
            </button>

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={imageFile ? "Mensaje opcional..." : "Escriba un mensaje..."}
              disabled={sending}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
              autoComplete="off"
            />
            <Button
              type="submit"
              disabled={(!input.trim() && !imageFile) || sending}
              loading={sending}
            >
              Enviar
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
