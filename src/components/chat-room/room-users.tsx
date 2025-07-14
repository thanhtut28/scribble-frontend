"use client";

import { useState } from "react";
import { useAuth } from "@/lib/providers/auth-provider";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Crown, Award, Clock, Pencil, CheckCircle2 } from "lucide-react";

export interface RoomUser {
  id: string;
  name: string;
  avatar: string;
  points: number;
  isCurrentUser?: boolean;
  joinOrder: number;
  joinedAt: Date;
  isReady?: boolean;
}

interface RoomUsersProps {
  users: RoomUser[];
  currentTurn: number;
  roundTime: number;
  timeLeft: number;
  currentDrawerId?: string;
  ownerId?: string;
}

export default function RoomUsers({
  users,
  currentTurn,
  roundTime,
  timeLeft,
  currentDrawerId,
  ownerId,
}: RoomUsersProps) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(true);

  // Sort users by points (descending)
  const sortedUsers = [...users].sort((a, b) => b.points - a.points);

  // Mark current user
  const usersWithCurrentUser = sortedUsers.map((roomUser) => ({
    ...roomUser,
    isCurrentUser: roomUser.id === user?.id,
  }));

  // Get current drawer based on drawer ID or fallback to turn number
  let currentDrawer: RoomUser | undefined;

  if (currentDrawerId) {
    // If we have a specific drawer ID from the game state, use that
    currentDrawer = users.find((u) => u.id === currentDrawerId);
  } else {
    // Fallback: Get the current drawer based on turn number
    const currentDrawerIndex = currentTurn % users.length;
    const joinOrderUsers = [...users].sort((a, b) => a.joinOrder - b.joinOrder);
    currentDrawer = joinOrderUsers[currentDrawerIndex];
  }

  // Format time as mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const getTimePercentage = () => {
    return (timeLeft / roundTime) * 100;
  };

  return (
    <div className="h-full rounded-xl border-2 border-dashed border-amber-300 bg-[#fffdf7] p-4 shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-amber-800">Players</h2>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-amber-600 hover:text-amber-800"
        >
          {expanded ? "Hide" : "Show"}
        </button>
      </div>

      {expanded && (
        <>
          {/* Timer if game is in progress */}
          <div className="mb-4 rounded-lg border border-amber-200 bg-white p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="mr-1 h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">
                  Drawing Time
                </span>
              </div>
              <span className="font-mono text-sm font-bold text-amber-900">
                {formatTime(timeLeft)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-200">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300"
                initial={{ width: "100%" }}
                animate={{ width: `${getTimePercentage()}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          <div className="space-y-2">
            {usersWithCurrentUser.map((_user, index) => (
              <div
                key={_user.id}
                className={clsx(
                  "flex items-center justify-between rounded-lg border p-2",
                  _user.isCurrentUser
                    ? "border-amber-400 bg-amber-50"
                    : "border-gray-100 bg-white",
                  currentDrawer?.id === _user.id &&
                    "border-green-400 bg-green-50",
                )}
              >
                <div className="flex items-center">
                  <div className="relative">
                    <div className="relative flex aspect-square h-8 w-8 items-center justify-center rounded-full border-2 border-amber-300 bg-amber-50 text-amber-700">
                      {ownerId === _user.id && (
                        <Crown className="absolute -top-2 left-0 mr-1 aspect-square h-4 w-4 rounded-full bg-white text-amber-400" />
                      )}
                      {_user.name.charAt(0).toUpperCase()}
                    </div>
                    {currentDrawer?.id === _user.id && (
                      <div className="absolute -top-1 -right-1 rounded-full bg-green-500 p-0.5 text-white">
                        <Pencil className="h-2.5 w-2.5" />
                      </div>
                    )}
                    {_user.isReady && !currentDrawer?.id && (
                      <div className="absolute -right-1 -bottom-1 rounded-full bg-green-500 p-0.5 text-white">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                      </div>
                    )}
                  </div>
                  <div className="ml-2">
                    <p
                      className={clsx(
                        "text-sm font-medium",
                        _user.isCurrentUser
                          ? "text-amber-800"
                          : "text-gray-700",
                        currentDrawer?.id === _user.id && "text-green-700",
                      )}
                    >
                      {_user.name}
                      {_user.isCurrentUser && (
                        <span className="ml-1 text-xs text-amber-600">
                          (You)
                        </span>
                      )}
                    </p>
                    {_user.isReady && !currentDrawer && (
                      <span className="text-xs text-green-600">Ready</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center">
                  <Award className="mr-1 h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium text-amber-800">
                    {_user.points}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
