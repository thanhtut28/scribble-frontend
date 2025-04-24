"use client";

import ChatRoom from "@/components/chat-room/chat-room";
import RoomUsers, { RoomUser } from "@/components/chat-room/room-users";
import DrawingBoard from "@/components/drawing-board/drawing-board";
import { useEffect, useRef, useState } from "react";

export default function DrawingRoomTemplate() {
  const [currentTurn, setCurrentTurn] = useState(0);
  const [timeLeft, setTimeLeft] = useState(80);
  const [roundTime] = useState(80); // Fixed round time
  const [showTurnNotification, setShowTurnNotification] = useState(false);
  const [currentDrawerName, setCurrentDrawerName] = useState("");
  const turnChangeAudio = useRef<HTMLAudioElement | null>(null);
  // console.log(showTurnNotification, currentDrawerName);

  const [users] = useState<RoomUser[]>([
    {
      id: "1",
      name: "CreativeMind",
      avatar: "/placeholder.svg?height=40&width=40",
      points: 520,
      joinOrder: 0, // First to join
      joinedAt: new Date(Date.now() - 1000 * 60 * 30), // Joined 30 minutes ago
    },
    {
      id: "2",
      name: "ArtisticSoul",
      avatar: "/placeholder.svg?height=40&width=40",
      points: 480,
      joinOrder: 1, // Second to join
      joinedAt: new Date(Date.now() - 1000 * 60 * 25), // Joined 25 minutes ago
    },
    {
      id: "3",
      name: "DoodleMaster",
      avatar: "/placeholder.svg?height=40&width=40",
      points: 350,
      joinOrder: 2, // Third to join
      joinedAt: new Date(Date.now() - 1000 * 60 * 20), // Joined 20 minutes ago
    },
    {
      id: "4",
      name: "SketchWizard",
      avatar: "/placeholder.svg?height=40&width=40",
      points: 320,
      isCurrentUser: true,
      joinOrder: 3, // Fourth to join
      joinedAt: new Date(Date.now() - 1000 * 60 * 15), // Joined 15 minutes ago
    },
    {
      id: "5",
      name: "PaintPro",
      avatar: "/placeholder.svg?height=40&width=40",
      points: 290,
      joinOrder: 4, // Fifth to join
      joinedAt: new Date(Date.now() - 1000 * 60 * 10), // Joined 10 minutes ago
    },
    {
      id: "6",
      name: "ColorGenius",
      avatar: "/placeholder.svg?height=40&width=40",
      points: 180,
      joinOrder: 5, // Sixth to join
      joinedAt: new Date(Date.now() - 1000 * 60 * 5), // Joined 5 minutes ago
    },
  ]);
  // TODO: Refactor this to use a custom hook for turn management
  // Initialize audio on component mount
  useEffect(() => {
    turnChangeAudio.current = new Audio("/turn-change.mp3");
    // We're using a placeholder URL since we don't have an actual audio file
    // In a real app, you would use an actual sound file
  }, []);

  // Function to get the current drawer based on turn number
  const getCurrentDrawer = () => {
    const joinOrderUsers = [...users].sort((a, b) => a.joinOrder - b.joinOrder);
    const currentDrawerIndex = currentTurn % users.length;
    return joinOrderUsers[currentDrawerIndex];
  };

  // Function to advance to the next turn automatically
  const nextTurn = () => {
    const nextTurnNumber = currentTurn + 1;
    setCurrentTurn(nextTurnNumber);
    setTimeLeft(roundTime); // Reset timer for new turn

    // Get the next drawer's name
    const joinOrderUsers = [...users].sort((a, b) => a.joinOrder - b.joinOrder);
    const nextDrawerIndex = nextTurnNumber % users.length;
    const nextDrawer = joinOrderUsers[nextDrawerIndex];

    if (nextDrawer) {
      setCurrentDrawerName(nextDrawer.name);
      setShowTurnNotification(true);

      // Play sound effect
      if (turnChangeAudio.current) {
        turnChangeAudio.current
          .play()
          .catch((e) => console.log("Audio play failed:", e));
      }

      // Hide notification after 3 seconds
      setTimeout(() => {
        setShowTurnNotification(false);
      }, 3000);
    }
  };

  // Automatic timer countdown
  useEffect(() => {
    if (timeLeft <= 0) {
      nextTurn();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft]);

  // Set initial drawer name on first render
  useEffect(() => {
    const currentDrawer = getCurrentDrawer();
    if (currentDrawer) {
      setCurrentDrawerName(currentDrawer.name);
    }
  }, []);

  //   // Function to add a new user (for demo purposes)
  //   const addNewUser = () => {
  //     const newUser: RoomUser = {
  //       id: `new-${Date.now()}`,
  //       name: `Artist${Math.floor(Math.random() * 1000)}`,
  //       avatar: "/placeholder.svg?height=40&width=40",
  //       points: 0,
  //       joinOrder: users.length, // Assign next join order
  //       joinedAt: new Date(), // Joined now
  //     };

  //     setUsers([...users, newUser]);
  //   };
  return (
    <div className="relative flex h-screen items-center justify-center p-10">
      {/* <AnimatePresence>
        {showTurnNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-4 rounded-lg border-2 border-amber-500 bg-amber-100 p-3 text-center shadow-lg"
          >
            <div className="flex items-center justify-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <span className="text-lg font-bold text-amber-800">
                {currentDrawerName}&apos;s turn to draw!
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence> */}
      <div className="grid w-full grid-cols-7 gap-4">
        <div className="col-span-2">
          <RoomUsers
            users={users}
            currentTurn={currentTurn}
            roundTime={roundTime}
            timeLeft={timeLeft}
          />
        </div>
        <div className="col-span-3">
          <DrawingBoard />
        </div>
        <div className="col-span-2">
          <ChatRoom />
        </div>
      </div>
    </div>
  );
}
