"use client";

import RoomList from "@/components/join-room/room-list";
import { Palette } from "lucide-react";
import { useSocket } from "@/lib/providers/socket-provider";
import { useState } from "react";
import { toast } from "sonner";
import SocketReconnect from "@/components/socket/socket-reconnect";

const JoinRoomTemplate = () => {
  const { refreshRooms, isConnected, connecting } = useSocket();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshRooms();
      toast.success("Room list refreshed");
    } catch (err) {
      console.error("Failed to refresh rooms:", err);
      toast.error("Failed to refresh room list");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Decorative elements */}
      <div className="absolute top-20 right-10 h-16 w-16 rounded-full bg-purple-500 opacity-20"></div>
      <div className="absolute top-40 left-10 h-12 w-12 rounded-full bg-green-500 opacity-20"></div>
      <div className="absolute right-20 bottom-20 h-20 w-20 rounded-full bg-blue-500 opacity-20"></div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-2 flex items-center justify-center">
            <Palette className="mr-2 hidden h-8 w-8 text-amber-600 md:flex" />
            <h1 className="font-comic text-4xl font-bold text-amber-800">
              Join a Drawing Room
            </h1>
          </div>
          <p className="text-amber-700">
            Find a room to showcase your artistic skills or join friends for a
            fun drawing session!
          </p>
        </div>

        {/* Socket Reconnect Component */}
        <SocketReconnect className="mb-6" />

        <RoomList />
      </div>
    </div>
  );
};

export default JoinRoomTemplate;
