"use client";

import { useState, useRef, useEffect } from "react";
import ChatMessage, { type Message } from "./ChatMessage";
import ChatInput from "./ChatInput";

function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "system",
      text: 'Hola! Soy tu asistente de bodega. Puedes decirme cosas como "vendi 3 arroces a 5 soles" o "cuanto stock tengo de azucar".',
      timestamp: new Date(),
    },
  ]);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(text: string) {
    // Add user message
    const userMsg: Message = {
      id: generateId(),
      role: "user",
      text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);

    try {
      const res = await fetch("/api/chat/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      let responseText: string;

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        responseText =
          body?.error ?? "Lo siento, hubo un error al procesar tu mensaje.";
      } else {
        const json = await res.json();
        const data = json.data;
        // The chat service might return different shapes; handle common ones
        if (typeof data === "string") {
          responseText = data;
        } else if (data?.reply) {
          responseText = data.reply;
        } else if (data?.message) {
          responseText = data.message;
        } else {
          responseText = JSON.stringify(data, null, 2);
        }
      }

      const systemMsg: Message = {
        id: generateId(),
        role: "system",
        text: responseText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, systemMsg]);
    } catch {
      const errorMsg: Message = {
        id: generateId(),
        role: "system",
        text: "Error de conexion. Intenta de nuevo.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-800">
          Chat de Bodega
        </h2>
        <p className="text-xs text-gray-500">
          Registra ventas, consulta stock y mas usando lenguaje natural
        </p>
      </div>

      {/* Messages area */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md bg-gray-200 px-4 py-3">
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-500" />
                <span
                  className="h-2 w-2 animate-bounce rounded-full bg-gray-500"
                  style={{ animationDelay: "0.1s" }}
                />
                <span
                  className="h-2 w-2 animate-bounce rounded-full bg-gray-500"
                  style={{ animationDelay: "0.2s" }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={sending} />
    </div>
  );
}
