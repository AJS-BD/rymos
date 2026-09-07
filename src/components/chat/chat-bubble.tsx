"use client";

import { cn } from "@/lib/utils";
import { Check, CheckCheck } from "lucide-react";

interface ChatBubbleProps {
  content: string;
  sender: "customer" | "admin";
  timestamp: string;
  read?: boolean;
  isOwn?: boolean;
}

export default function ChatBubble({
  content,
  sender,
  timestamp,
  read = false,
  isOwn = false,
}: ChatBubbleProps) {
  const isCustomer = sender === "customer";

  return (
    <div
      className={cn(
        "flex w-full mb-3",
        isOwn ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm",
          isOwn
            ? "bg-gray-900 text-white rounded-br-md"
            : "bg-white text-gray-900 border border-gray-200 rounded-bl-md"
        )}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {content}
        </p>
        <div
          className={cn(
            "flex items-center justify-end gap-1 mt-1.5",
            isOwn ? "text-gray-400" : "text-gray-400"
          )}
        >
          <span className="text-[10px]">
            {new Date(timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          {isOwn && (
            <span className="ml-0.5">
              {read ? (
                <CheckCheck className="h-3 w-3 text-blue-400" />
              ) : (
                <Check className="h-3 w-3" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
