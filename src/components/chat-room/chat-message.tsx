"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Palette } from "lucide-react";
import type { Message } from "./chat-room";

interface ChatMessagesProps {
  messages: Message[];
}

export default function ChatMessages({ messages }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-full flex-col space-y-3 overflow-y-auto bg-inherit p-4">
      {messages.map((message, index) => {
        const isCurrentUser = message.isCurrentUser;
        const showAvatar =
          !isCurrentUser &&
          (!messages[index - 1] ||
            messages[index - 1].sender !== message.sender);

        return (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`flex ${isCurrentUser ? "flex-row-reverse" : "flex-row"} max-w-[80%] items-end gap-2`}
            >
              {!isCurrentUser && showAvatar ? (
                <Avatar className="h-8 w-8 border-2 border-amber-300">
                  <AvatarImage src={message.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="bg-gradient-to-br from-amber-200 to-amber-300 text-amber-700">
                    {message.sender[0]}
                  </AvatarFallback>
                </Avatar>
              ) : !isCurrentUser ? (
                <div className="w-8" />
              ) : null}

              <div className="flex flex-col">
                {!isCurrentUser && showAvatar && (
                  <span className="mb-1 ml-1 flex items-center text-xs font-medium text-amber-700">
                    <Palette className="mr-1 h-3 w-3" />
                    {message.sender}
                  </span>
                )}
                <div
                  className={`relative rounded-2xl border-2 ${
                    isCurrentUser
                      ? "rounded-br-none border-amber-600 bg-amber-500 text-white"
                      : "rounded-bl-none border-amber-300 bg-white"
                  } px-3 py-2 shadow-md`}
                >
                  {/* Decorative dots */}
                  <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-400"></div>
                  {isCurrentUser && (
                    <div className="absolute -bottom-1 -left-1 h-2 w-2 rounded-full bg-green-400"></div>
                  )}

                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}
