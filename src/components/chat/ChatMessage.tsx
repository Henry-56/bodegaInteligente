"use client";

import { cn } from "@/lib/utils";

export interface Message {
  id: string;
  role: "user" | "system";
  text: string;
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm",
          isUser
            ? "rounded-br-md bg-blue-600 text-white"
            : "rounded-bl-md bg-gray-200 text-gray-900"
        )}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {message.text}
        </p>
        <p
          className={cn(
            "mt-1 text-right text-[10px]",
            isUser ? "text-blue-200" : "text-gray-500"
          )}
        >
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}
