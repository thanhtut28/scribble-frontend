"use client";

import { useState, type KeyboardEvent } from "react";
import { Send, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({
  onSendMessage,
  disabled = false,
  placeholder = "Share your artistic thoughts...",
}: ChatInputProps) {
  const [message, setMessage] = useState("");

  const getAlphabetCount = (text: string) =>
    text.split("").filter((char) => /[a-zA-Z]/.test(char)).length;

  const handleSendMessage = () => {
    const trimmed = message.trim();
    if (trimmed && !disabled) {
      onSendMessage(trimmed);
      setMessage("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSendMessage();
  };

  return (
    <div className="border-t-2 border-dashed border-amber-300 bg-[#f8f4e8] p-3">
      <div
        className={cn(
          "flex items-center rounded-full border-2 border-amber-400 bg-white px-3 shadow-inner",
          disabled && "opacity-70",
        )}
      >
        <Palette className="h-4 w-4 text-amber-500" />
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="h-10 flex-1 bg-transparent py-2 pl-2 text-sm text-amber-800 outline-none placeholder:text-amber-400 disabled:cursor-not-allowed"
          aria-label="Message input"
        />
        <div className="flex items-center justify-center gap-1">
          <p className="text-sm font-semibold text-amber-700">
            {getAlphabetCount(message)}
          </p>
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || disabled}
            type="button"
            aria-label="Send"
            className={cn(
              "ml-2 h-8 w-8 rounded-full border-2",
              message.trim() && !disabled
                ? "border-amber-600 bg-amber-500 text-white hover:bg-amber-600"
                : "border-amber-300 bg-amber-200 text-amber-400",
            )}
          >
            <Send className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
