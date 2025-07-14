import { RoomUser } from "@/components/chat-room/room-users";
import { useEffect, useRef, useState } from "react";

// hooks/useTurnManager.ts
export function useTurnManager(users: RoomUser[], roundTime: number) {
  const [currentTurn, setCurrentTurn] = useState(0);
  const [timeLeft, setTimeLeft] = useState(roundTime);
  const [currentDrawerName, setCurrentDrawerName] = useState("");
  const [showTurnNotification, setShowTurnNotification] = useState(false);
  const turnChangeAudio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    turnChangeAudio.current = new Audio("/turn-change.mp3");
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) {
      nextTurn();
      return;
    }
    const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  useEffect(() => {
    const joinOrderUsers = [...users].sort((a, b) => a.joinOrder - b.joinOrder);
    setCurrentDrawerName(joinOrderUsers[currentTurn % users.length]?.name);
  }, [users, currentTurn]);

  const nextTurn = () => {
    const nextTurnNumber = currentTurn + 1;
    setCurrentTurn(nextTurnNumber);
    setTimeLeft(roundTime);
    const nextDrawer = [...users].sort((a, b) => a.joinOrder - b.joinOrder)[
      nextTurnNumber % users.length
    ];
    if (nextDrawer) {
      setCurrentDrawerName(nextDrawer.name);
      setShowTurnNotification(true);
      turnChangeAudio.current
        ?.play()
        .catch((e) => console.log("Audio play failed:", e));
      setTimeout(() => setShowTurnNotification(false), 3000);
    }
  };

  return {
    currentTurn,
    timeLeft,
    currentDrawerName,
    showTurnNotification,
    nextTurn,
  };
}
