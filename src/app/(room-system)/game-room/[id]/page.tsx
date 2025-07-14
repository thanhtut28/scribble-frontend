"use client";

import DrawingRoomTemplate from "@/templates/drawing-room-template";
import { useSocket } from "@/lib/providers/socket-provider";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function GameRoomPage() {
  const { id } = useParams();
  const roomId = typeof id === "string" ? id : Array.isArray(id) ? id[0] : "";
  const { currentRoom, isConnected, connecting } = useSocket();
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if we're connected and have loaded the current room data
    if (!connecting && isConnected) {
      setLoading(false);

      // Check if the user is in the right room
      if (currentRoom && currentRoom.id !== roomId) {
        toast.error("You're not in this room. Redirecting to join room page.");
        router.push("/join-room");
      }

      // If not in any room, redirect to join room
      if (!currentRoom) {
        toast.error("You need to join a room first");
        router.push("/join-room");
      }
    }
  }, [connecting, isConnected, currentRoom, roomId, router]);

  if (connecting || loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        <p className="text-amber-700">Loading drawing room...</p>
      </div>
    );
  }

  if (!currentRoom || currentRoom.id !== roomId) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        <p className="text-amber-700">Redirecting to join room page...</p>
      </div>
    );
  }

  return <DrawingRoomTemplate room={currentRoom} />;
}
