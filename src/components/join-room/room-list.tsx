"use client";

import { useState, useEffect } from "react";
import { Paintbrush, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import RoomPreviewCard from "./room-preview-card";
import { useRouter } from "next/navigation";
import { useSocket } from "@/lib/providers/socket-provider";
import { useUrlState } from "@/hooks/use-url-state";
import { Room as SocketRoom } from "@/lib/services/socket.service";
import { useAuthContext } from "@/lib/providers/auth-provider";

interface Room {
  roomId: string;
  roomName: string;
  hostName: string;
  hostAvatar?: string;
  players: number;
  maxPlayers: number;
  rounds: number;
  status: "waiting" | "in-progress" | "completed";
}

export default function RoomList() {
  // Check authentication state
  const { isAuthenticated, user } = useAuthContext();

  // Get rooms from socket provider
  const {
    rooms = [],
    isConnected,
    connecting,
    refreshRooms,
    connect,
    error,
  } = useSocket();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [connectionAttempted, setConnectionAttempted] = useState(false);
  const router = useRouter();

  // Effect to retry connection if needed
  useEffect(() => {
    if (!isConnected && !connecting && !connectionAttempted) {
      console.log("Attempting to reconnect socket from RoomList");
      console.log(
        "Auth state:",
        isAuthenticated ? "Authenticated" : "Not authenticated",
      );
      if (user) {
        console.log("User ID:", user.id);
      }
      connect();
      setConnectionAttempted(true);
    }
  }, [
    isConnected,
    connecting,
    connectionAttempted,
    connect,
    isAuthenticated,
    user,
  ]);

  // Log rooms data whenever it changes
  useEffect(() => {
    console.log(
      "Rooms data updated:",
      Array.isArray(rooms) ? rooms.length : "not an array",
    );
    if (Array.isArray(rooms) && rooms.length > 0) {
      console.log("First room:", rooms[0]);
    }
  }, [rooms]);

  // Get filters from URL state
  const [filters] = useUrlState({
    search: "",
    roomStatus: "all",
  });

  // Transform socket rooms to match our component's format
  const transformedRooms = Array.isArray(rooms)
    ? rooms.map((room: SocketRoom) => {
        // Find the room owner from users
        const owner = room.users?.find(
          (user) => user.userId === room.ownerId,
        )?.user;

        // Map the status
        let status: "waiting" | "in-progress" | "completed";
        switch (room.status) {
          case "PLAYING":
            status = "in-progress";
            break;
          case "FINISHED":
            status = "completed";
            break;
          default:
            status = "waiting";
        }

        return {
          roomId: room.id,
          roomName: room.name,
          hostName: owner?.username || "Unknown Host",
          hostAvatar: undefined, // Not provided in the socket service
          players: room.users?.length || 0,
          maxPlayers: room.maxPlayers,
          rounds: room.rounds,
          status,
        };
      })
    : [];

  // Apply filters
  const filteredRooms = transformedRooms.filter((room) => {
    // Filter by search term
    const matchesSearch =
      filters.search === "" ||
      room.roomName.toLowerCase().includes(filters.search.toLowerCase()) ||
      room.hostName.toLowerCase().includes(filters.search.toLowerCase());

    // Filter by room status
    const matchesStatus =
      filters.roomStatus === "all" ||
      (filters.roomStatus === "waiting" && room.status === "waiting") ||
      (filters.roomStatus === "in-progress" && room.status === "in-progress");

    return matchesSearch && matchesStatus;
  });

  const handleJoinRoom = (roomId: string) => {
    router.push(`/join-room/${roomId}`);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setConnectionAttempted(false); // Reset to allow reconnection attempts
    try {
      await refreshRooms();
    } catch (err) {
      console.error("Failed to refresh rooms:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Show loading state if connecting
  if (connecting) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="h-8 w-8 animate-spin text-amber-600" />
          <p className="text-amber-700">Connecting to drawing server...</p>
        </div>
      </div>
    );
  }

  // Show error state if not connected
  if (!isConnected) {
    return (
      <div className="flex h-40 flex-col items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-amber-700">
            Failed to connect to drawing server
            {error && (
              <span className="mt-2 block text-sm">Error: {error.message}</span>
            )}
          </p>
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4">
            <Button
              onClick={() => {
                setConnectionAttempted(false);
                connect().catch((err) => {
                  console.error("Manual reconnect failed:", err);
                });
              }}
              className="bg-amber-500 text-white hover:bg-amber-600"
              disabled={connecting}
            >
              {connecting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Reconnect"
              )}
            </Button>

            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="border-amber-300 text-amber-700"
            >
              Reload Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Paintbrush className="mr-2 h-6 w-6 text-amber-600" />
          <h2 className="text-2xl font-bold text-amber-800">
            Available Drawing Rooms{" "}
            {filteredRooms.length > 0 && `(${filteredRooms.length})`}
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={() => router.push("/create-room")}
            className="rounded-full border-2 border-amber-600 bg-amber-500 font-medium text-white shadow-md transition-all hover:bg-amber-600 hover:shadow-lg"
          >
            <Plus className="h-5 w-5" />
            Create New Room
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="border-amber-300 text-amber-700 hover:bg-amber-50"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`mr-1 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredRooms.map((room) => (
          <RoomPreviewCard
            key={room.roomId}
            roomId={room.roomId}
            roomName={room.roomName}
            hostName={room.hostName}
            hostAvatar={room.hostAvatar}
            players={room.players}
            maxPlayers={room.maxPlayers}
            rounds={room.rounds}
            status={room.status}
            onJoin={handleJoinRoom}
          />
        ))}
      </div>

      {filteredRooms.length === 0 && (
        <div className="mt-8 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 p-8 text-center">
          <div className="mb-4 rounded-full bg-amber-100 p-3">
            <Paintbrush className="h-8 w-8 text-amber-600" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-amber-800">
            No Drawing Rooms Available
          </h3>
          <p className="mb-4 text-amber-700">
            {filters.search || filters.roomStatus !== "all"
              ? "No rooms match your current filters. Try adjusting your search criteria."
              : "Be the first to create a room and start drawing!"}
          </p>
          <Button
            className="bg-amber-500 text-white hover:bg-amber-600"
            onClick={() => router.push("/create-room")}
          >
            <Plus className="mr-1 h-4 w-4" />
            Create a Room
          </Button>
        </div>
      )}
    </div>
  );
}
