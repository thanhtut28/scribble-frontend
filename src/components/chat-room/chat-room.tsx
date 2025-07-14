"use client";

import { useState, useRef, useEffect } from "react";
import ChatMessages from "./chat-message";
import ChatInput from "./chat-input";
import { useGame } from "@/lib/providers/game-provider";
import { Message as GameMessage } from "@/lib/services/game.service";
import { useAuth } from "@/lib/providers/auth-provider";

export interface Message {
  id: string;
  content: string;
  sender: string;
  userId?: string;
  avatar?: string;
  isCurrentUser?: boolean;
  isCorrect?: boolean;
  timestamp?: string;
}

export default function ChatRoom() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const { user } = useAuth();
  const {
    gameState,
    messages: gameMessages,
    sendChatMessage,
    currentRound,
    isDrawer,
  } = useGame();

  // Convert game messages to our format
  useEffect(() => {
    if (!gameMessages || !gameMessages.length) return;

    const formattedMessages = gameMessages.map((msg: GameMessage) => ({
      id: msg.id,
      content: msg.content,
      sender: msg.username || "Unknown",
      userId: msg.userId,
      isCurrentUser: msg.userId === user?.id, // Mark current user's messages
      isCorrect: msg.isCorrect,
      timestamp: new Date(msg.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));

    setMessages(formattedMessages);
  }, [gameMessages, user?.id]);

  // Add welcome message when the component mounts
  useEffect(() => {
    // Only add welcome message if game has started but no messages yet
    if (gameState && (!messages || messages.length === 0)) {
      const welcomeMessage: Message = {
        id: "welcome-message",
        content: isDrawer
          ? "You are drawing! Others will try to guess your word."
          : "Guess the word being drawn in the chat!",
        sender: "Game",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages([welcomeMessage]);
    }
  }, [gameState, messages, isDrawer]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (content: string) => {
    if (!content.trim()) return;

    // If there's no active game, just add to local messages
    if (!gameState) {
      const newMessage: Message = {
        id: Date.now().toString(),
        content,
        sender: user?.username || "You",
        userId: user?.id,
        isCurrentUser: true,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages([...messages, newMessage]);
      return;
    }

    // In a game, send to the server
    sendChatMessage(content);

    // Don't add the message locally, it will come back through the websocket
    // and be added to the messages automatically
  };

  // Check if the current user is the drawer and should be blocked from guessing
  const isInputDisabled = !!currentRound && isDrawer;

  // Check if all players have guessed correctly
  const hasGuessedCorrectly =
    gameState &&
    gameMessages?.some((msg) => msg.isCorrect && msg.userId === user?.id);

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
            Game Chat
          </h2>
          <p className="text-sm text-amber-700">
            {isInputDisabled
              ? "You're drawing! You can't guess."
              : hasGuessedCorrectly
                ? "You guessed correctly!"
                : "Guess the word being drawn!"}
          </p>
        </div>

        <div className="scrollbar-thin scrollbar-thumb-amber-400 scrollbar-track-amber-100 flex-1 overflow-y-auto">
          <ChatMessages messages={messages} />
          <div ref={messagesEndRef} />
        </div>

        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={isInputDisabled || hasGuessedCorrectly === true}
          placeholder={
            isInputDisabled
              ? "You're the drawer, you can't guess"
              : hasGuessedCorrectly
                ? "You've already guessed correctly"
                : "Type your guess here..."
          }
        />
      </div>
    </div>
  );
}
