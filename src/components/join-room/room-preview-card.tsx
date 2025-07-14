"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowRight,
  Crown,
  Loader2,
  Palette,
  Target,
  Users,
  Lock,
  CheckCircle2,
  RefreshCw,
  Check,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface RoomPreviewProps {
  roomId: string;
  roomName: string;
  hostName: string;
  hostAvatar?: string;
  players: number;
  maxPlayers: number;
  rounds: number;
  status: "waiting" | "in-progress" | "completed";
  onJoinRoom: (roomId: string, isPrivate: boolean) => void;
  onLeaveRoom: (roomId: string) => void;
  isLoading?: boolean;
  isPrivate?: boolean;
  isJoined?: boolean;
  isOwner?: boolean;
}

const RoomPreviewCard = ({
  roomId,
  roomName,
  hostName,
  hostAvatar,
  players,
  maxPlayers,
  rounds,
  status,
  onJoinRoom,
  onLeaveRoom,
  isLoading = false,
  isPrivate = false,
  isJoined = false,
  isOwner = false,
}: RoomPreviewProps) => {
  const [isHovering, setIsHovering] = useState(false);
  const router = useRouter();

  const getStatusColor = () => {
    switch (status) {
      case "waiting":
        return "bg-green-100 text-green-700 border-green-300";
      case "in-progress":
        return "bg-amber-100 text-amber-700 border-amber-300";
      case "completed":
        return "bg-gray-100 text-gray-700 border-gray-300";
      default:
        return "bg-green-100 text-green-700 border-green-300";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "waiting":
        return "Open to Join";
      case "in-progress":
        return "Game in Progress";
      case "completed":
        return "Game Completed";
      default:
        return "Open to Join";
    }
  };

  // Handle entering (navigating to) a joined room
  const handleEnterRoom = () => {
    router.push(`/game-room/${roomId}`);
  };

  return (
    <div className="relative mx-auto w-full max-w-md">
      {/* Decorative elements */}
      <div className="absolute -right-4 -bottom-4 h-10 w-10 rounded-full bg-purple-500 opacity-70"></div>
      <div className="absolute top-1/3 -left-6 h-8 w-8 rounded-full bg-green-500 opacity-70"></div>

      <Card
        className={`relative w-full overflow-hidden border-4 border-dashed ${
          isJoined ? "border-green-500" : "border-amber-500"
        } bg-[#fffdf7] shadow-lg transition-all duration-300`}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        style={{
          transform: isHovering ? "translateY(-5px)" : "translateY(0)",
          boxShadow: isHovering
            ? "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
            : "",
        }}
      >
        <div className="absolute top-0 left-0 h-20 w-20 rounded-br-full bg-blue-100 opacity-50"></div>
        <div className="absolute right-0 bottom-0 h-24 w-24 rounded-tl-full bg-red-100 opacity-50"></div>

        <CardHeader
          className={`border-b-2 border-dashed ${isJoined ? "border-green-300 bg-[#f0f9f0]" : "border-amber-300 bg-[#f8f4e8]"} pb-3`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Palette
                className={`mr-2 h-6 w-6 ${isJoined ? "text-green-600" : "text-amber-600"}`}
              />
              <CardTitle
                className={`font-comic text-xl font-bold ${isJoined ? "text-green-800" : "text-amber-800"}`}
              >
                {roomName}
                {isPrivate && (
                  <Lock className="ml-2 inline h-4 w-4 text-amber-600" />
                )}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {isJoined && (
                <Badge className="border border-green-300 bg-green-100 px-2 py-1 text-green-700">
                  Your Room
                </Badge>
              )}
              <Badge className={`${getStatusColor()} border px-2 py-1`}>
                {getStatusText()}
              </Badge>
            </div>
          </div>
          <CardDescription className="flex items-center text-amber-700">
            <div className="flex items-center">
              <Crown className="mr-1 h-4 w-4 text-amber-600" />
              <span className="mr-2">Host:</span>
              <Avatar className="h-6 w-6">
                <AvatarImage src={hostAvatar || "/placeholder.svg"} />
                <AvatarFallback className="bg-amber-200 text-xs text-amber-700">
                  {hostName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="ml-1 text-sm font-medium">{hostName}</span>
            </div>
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center rounded-lg border border-amber-200 bg-white/80 p-2">
              <div className="flex items-center text-amber-800">
                <Users className="h-4 w-4 text-amber-600" />
                <span className="ml-1 text-xs">Players</span>
              </div>
              <p className="mt-1 text-center font-medium">
                {players}/{maxPlayers}
              </p>
            </div>

            <div className="flex flex-col items-center rounded-lg border border-amber-200 bg-white/80 p-2">
              <div className="flex items-center text-amber-800">
                <Target className="h-4 w-4 text-amber-600" />
                <span className="ml-1 text-xs">Rounds</span>
              </div>
              <p className="mt-1 text-center font-medium">{rounds}</p>
            </div>

            {isPrivate && (
              <div className="flex flex-col items-center rounded-lg border border-amber-200 bg-white/80 p-2">
                <div className="flex items-center text-amber-800">
                  <Lock className="h-4 w-4 text-amber-600" />
                  <span className="ml-1 text-xs">Private</span>
                </div>
                <p className="mt-1 text-center text-xs font-medium">
                  Password Required
                </p>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex -space-x-2">
              {[...Array(Math.min(players, 5))].map((_, i) => (
                <Avatar key={i} className="h-8 w-8 border-2 border-white">
                  <AvatarFallback className="bg-gradient-to-br from-amber-200 to-amber-300 text-xs text-amber-700">
                    {String.fromCharCode(65 + i)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {players > 5 && (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-amber-100 text-xs font-medium text-amber-800">
                  +{players - 5}
                </div>
              )}
            </div>

            <div className="text-xs text-amber-700">
              {status === "waiting"
                ? "Waiting for players..."
                : status === "in-progress"
                  ? "Game in progress"
                  : "Game completed"}
            </div>
          </div>
        </CardContent>

        <CardFooter
          className={`flex flex-col gap-2 border-t-2 border-dashed ${isJoined ? "border-green-300" : "border-amber-300"} py-3`}
        >
          {isJoined ? (
            <div className="flex w-full flex-col gap-2">
              <Button
                onClick={handleEnterRoom}
                className="w-full flex-1 rounded-full border-2 border-green-600 bg-green-500 font-medium text-white shadow-md transition-all hover:bg-green-600 hover:shadow-lg"
              >
                <Check className="mr-1 h-4 w-4" />
                Enter Room
              </Button>

              <Button
                onClick={() => onLeaveRoom(roomId)}
                className="w-full rounded-full border-red-500 bg-red-500 text-red-100 hover:bg-red-600 hover:text-red-100"
              >
                Leave
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => onJoinRoom(roomId, isPrivate)}
              className="w-full rounded-full border-2 border-amber-600 bg-amber-500 font-medium text-white shadow-md transition-all hover:bg-amber-600 hover:shadow-lg"
              disabled={
                isLoading || status === "in-progress" || players >= maxPlayers
              }
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : players >= maxPlayers ? (
                "Room full"
              ) : status === "in-progress" ? (
                "Game in progress"
              ) : (
                "Join Room"
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default RoomPreviewCard;
