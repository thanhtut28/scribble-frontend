"use client";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, Pencil, Medal, Star, Clock, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface RoomUser {
  id: string;
  name: string;
  avatar?: string;
  points: number;
  isCurrentUser?: boolean;
  joinOrder: number; // Property to track join order
  joinedAt: Date; // Timestamp when user joined
}

interface RoomUsersProps {
  users: RoomUser[];
  currentTurn: number; // Current turn number
  roundTime?: number; // Time in seconds for each drawing round
  timeLeft?: number; // Time left in current round
}

export default function RoomUsers({
  users,
  currentTurn,
  roundTime = 80,
  timeLeft = 65,
}: RoomUsersProps) {
  // Sort users by points (highest first)
  const sortedUsers = [...users].sort((a, b) => b.points - a.points);

  // Add rank to each user
  const rankedUsers = sortedUsers.map((user, index) => ({
    ...user,
    rank: index + 1,
  }));

  // Sort users by join order (for the drawer list display)
  const joinOrderUsers = [...users].sort((a, b) => a.joinOrder - b.joinOrder);

  // Determine current drawer based on turn number and join order
  // We use modulo to cycle through users based on their join order
  const currentDrawerIndex = currentTurn % users.length;
  const currentDrawer = joinOrderUsers[currentDrawerIndex];

  // Calculate progress percentage for the timer
  const progressPercentage = (timeLeft / roundTime) * 100;

  // Determine if time is running low (less than 10 seconds)
  const isTimeLow = timeLeft < 10;

  return (
    <div className="relative mx-auto w-full max-w-md">
      {/* Decorative elements */}
      {/* <div className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-green-500 opacity-70"></div> */}
      <div className="absolute bottom-1/3 -left-3 h-6 w-6 rounded-full bg-purple-500 opacity-70"></div>

      <div className="relative rounded-lg border-2 border-dashed border-amber-500 bg-[#fffdf7] shadow-lg">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 h-16 w-16 rounded-bl-full bg-blue-100 opacity-50"></div>
        <div className="absolute bottom-0 left-0 h-20 w-20 rounded-tr-full bg-red-100 opacity-50"></div>

        <div className="border-b-2 border-dashed border-amber-300 bg-[#f8f4e8] p-3">
          <div className="flex items-center justify-between">
            <h2 className="font-comic text-lg font-bold text-amber-800">
              Artists in Room
            </h2>
            <div className="flex items-center gap-1 rounded-full border border-amber-300 bg-white px-2 py-1 text-xs font-medium text-amber-700">
              <Clock className="h-3 w-3" />
              <span>Turn {currentTurn + 1}</span>
            </div>
          </div>

          {/* Current drawer info and timer */}
          <div className="mt-2 rounded-lg border border-amber-300 bg-white p-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pencil className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">
                  {currentDrawer
                    ? `${currentDrawer.name} is drawing`
                    : "Waiting for players..."}
                </span>
              </div>
              <motion.div
                animate={isTimeLow ? { scale: [1, 1.1, 1] } : {}}
                transition={{
                  repeat: isTimeLow ? Number.POSITIVE_INFINITY : 0,
                  duration: 0.5,
                }}
              >
                <Badge
                  className={`${
                    isTimeLow
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700"
                  } flex items-center gap-1`}
                >
                  {isTimeLow && <AlertTriangle className="h-3 w-3" />}
                  {timeLeft}s
                </Badge>
              </motion.div>
            </div>

            {/* Timer progress bar */}
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <motion.div
                className={`h-full ${isTimeLow ? "bg-red-500" : "bg-amber-500"}`}
                initial={{ width: `${progressPercentage}%` }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Drawing order display */}
          <div className="mt-2 flex items-center overflow-x-auto py-1">
            <span className="mr-2 text-xs text-amber-700">Drawing Order:</span>
            <div className="flex space-x-1">
              {joinOrderUsers.map((user, index) => (
                <div
                  key={`order-${user.id}`}
                  className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border ${
                    index === currentDrawerIndex
                      ? "border-amber-600 bg-amber-500 text-white"
                      : "border-amber-300 bg-white text-amber-700"
                  } text-xs font-bold`}
                  title={user.name}
                >
                  {index + 1}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="max-h-[300px] overflow-y-auto p-2">
          <div className="space-y-2">
            {rankedUsers.map((user) => {
              const isDrawing = user.id === currentDrawer?.id;

              return (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`relative rounded-lg border-2 ${
                    isDrawing
                      ? "border-amber-500 bg-amber-50"
                      : "border-amber-200 bg-white"
                  } p-2 shadow-md transition-all duration-300 hover:shadow-lg`}
                >
                  {/* Rank indicator */}
                  <div className="absolute -top-2 -left-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-amber-500 text-xs font-bold text-white shadow-md">
                    {user.rank <= 3 ? <RankIcon rank={user.rank} /> : user.rank}
                  </div>

                  {/* Drawing indicator */}
                  {isDrawing && (
                    <motion.div
                      className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-green-500 text-white shadow-md"
                      animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0],
                      }}
                      transition={{
                        repeat: Number.POSITIVE_INFINITY,
                        duration: 2,
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </motion.div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Avatar
                        className={`h-10 w-10 border-2 ${user.isCurrentUser ? "border-amber-500" : "border-amber-200"}`}
                      >
                        <AvatarImage src={user.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="bg-gradient-to-br from-amber-200 to-amber-300 text-amber-700">
                          {user.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center">
                          <p className="font-medium text-amber-800">
                            {user.name}
                          </p>
                          {user.isCurrentUser && (
                            <Badge className="ml-1 bg-amber-200 px-1 text-[10px] text-amber-800">
                              You
                            </Badge>
                          )}
                          <Badge
                            className="ml-1 bg-blue-100 px-1 text-[10px] text-blue-800"
                            title="Join order"
                          >
                            #{user.joinOrder + 1}
                          </Badge>
                        </div>
                        <div className="flex items-center text-xs text-amber-600">
                          <Star className="mr-1 h-3 w-3 fill-amber-400 text-amber-400" />
                          <span>{user.points} points</span>
                        </div>
                      </div>
                    </div>

                    {/* Points badge */}
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-amber-300 bg-white text-sm font-bold text-amber-700">
                      {user.points}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for rank icons
function RankIcon({ rank }: { rank: number }) {
  switch (rank) {
    case 1:
      return <Crown className="h-3 w-3 fill-yellow-300 text-yellow-600" />;
    case 2:
      return <Medal className="h-3 w-3 fill-gray-300 text-gray-500" />;
    case 3:
      return <Medal className="h-3 w-3 fill-amber-600 text-amber-800" />;
    default:
      return <>{rank}</>;
  }
}
