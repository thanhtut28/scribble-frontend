"use client";

import { useState, useRef, useEffect } from "react";
import ChatMessages from "./chat-message";
import ChatInput from "./chat-input";

export interface Message {
  id: string;
  content: string;
  sender: string;
  avatar?: string;
  isCurrentUser?: boolean;
}

export default function ChatRoom() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hey there! Welcome to our artistic doodle chat 🎨",
      sender: "Sarah",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: "2",
      content: "Thanks! I love the playful design of this app!",
      sender: "You",
      isCurrentUser: true,
    },
    {
      id: "3",
      content:
        "The dashed borders and fun colors really make it stand out. Ready to play?",
      sender: "Alex",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    {
      id: "4",
      content: "I can't wait to show off my doodling skills in the next round!",
      sender: "Sarah",
      avatar: "/placeholder.svg?height=40&width=40",
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (content: string) => {
    if (!content.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: "You",
      isCurrentUser: true,
    };

    setMessages([...messages, newMessage]);
  };

  return (
    <div className="relative mx-auto w-full max-w-md">
      {/* Decorative elements */}
      <div className="absolute -top-4 -right-4 h-10 w-10 rounded-full bg-purple-500 opacity-70"></div>
      {/* <div className="absolute top-1/3 -left-6 h-8 w-8 rounded-full bg-green-500 opacity-70"></div>
      <div className="absolute -bottom-4 -left-4 h-12 w-12 rounded-full bg-blue-500 opacity-70"></div> */}

      <div className="relative flex h-[480px] flex-col overflow-hidden rounded-lg border-2 border-dashed border-amber-500 bg-[#fffdf7] shadow-lg">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 h-20 w-20 rounded-br-full bg-blue-100 opacity-50"></div>
        <div className="absolute right-0 bottom-0 h-24 w-24 rounded-tl-full bg-red-100 opacity-50"></div>

        <div className="border-b-2 border-dashed border-amber-300 bg-[#f8f4e8] p-3">
          <h2 className="font-comic text-xl font-bold text-amber-800">
            Artistic Chat Room
          </h2>
          <p className="text-sm text-amber-700">
            Share your creative ideas with friends!
          </p>
        </div>

        <div className="scrollbar-thin scrollbar-thumb-amber-400 scrollbar-track-amber-100 flex-1 overflow-y-auto">
          <ChatMessages messages={messages} />
          <div ref={messagesEndRef} />
        </div>

        <ChatInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
}
