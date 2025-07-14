"use client";

import { useState, useEffect } from "react";
import {
  Paintbrush,
  Plus,
  RefreshCw,
  Lock,
  Search,
  Filter,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import RoomPreviewCard from "./room-preview-card";
import { useRouter } from "next/navigation";
import { useSocket } from "@/lib/providers/socket-provider";
import { useAuth } from "@/lib/providers/auth-provider";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Room as SocketRoom } from "@/lib/services/socket.service";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Room {
  roomId: string;
  roomName: string;
  hostName: string;
  hostAvatar?: string;
  players: number;
  maxPlayers: number;
  rounds: number;
  status: "waiting" | "in-progress" | "completed";
  isPrivate: boolean;
}

export default function RoomList() {
  // Check authentication state
  const { isAuthenticated, user } = useAuth();

  // Get rooms from socket provider
  const {
    rooms = [],
    isConnected,
    connecting,
    refreshRooms,
    joinRoom,
    leaveRoom,
    currentRoom,
  } = useSocket();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [joiningRoom, setJoiningRoom] = useState<string | null>(null);
  const [roomPassword, setRoomPassword] = useState<string>("");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const router = useRouter();

  // Local state for filters
  const [search, setSearch] = useState("");
  const [roomStatus, setRoomStatus] = useState("all");

  // Read filter values from parent component via props
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const searchFromUrl = searchParams.get("search") || "";
    const statusFromUrl = searchParams.get("roomStatus") || "all";

    setSearch(searchFromUrl);
    setRoomStatus(statusFromUrl);
  }, []);

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
          case "WAITING":
            status = "waiting";
            break;
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
          isPrivate: room.isPrivate || false,
          ownerId: room.ownerId,
        };
      })
    : [];

  // Apply filters
  const filteredRooms = transformedRooms.filter((room) => {
    // Filter by search term
    const matchesSearch =
      search === "" ||
      room.roomName.toLowerCase().includes(search.toLowerCase()) ||
      room.hostName.toLowerCase().includes(search.toLowerCase());

    // Filter by room status
    const matchesStatus =
      roomStatus === "all" ||
      (roomStatus === "waiting" && room.status === "waiting") ||
      (roomStatus === "in-progress" && room.status === "in-progress");

    return matchesSearch && matchesStatus;
  });

  // Check if player is already in a specific room
  const isPlayerInRoom = (roomId: string) => {
    return currentRoom?.id === roomId;
  };

  // Handle going to a room the player is already in
  const handleGoToRoom = (roomId: string) => {
    router.push(`/game-room/${roomId}`);
  };

  // Handle search filter
  const handleSearchChange = (value: string) => {
    setSearch(value);
  };

  // Handle status filter
  const handleStatusChange = (value: string) => {
    setRoomStatus(value);
  };

  // Reset filters
  const resetFilters = () => {
    setSearch("");
    setRoomStatus("all");
  };

  const handleLeaveRoom = async (roomId: string) => {
    if (!isAuthenticated) {
      toast.error("You need to be logged in to leave a room");
      router.push("/login");
      return;
    }

    if (!isConnected) {
      toast.error("You are not connected to the server");
      return;
    }

    await leaveRoom(roomId);
  };

  const handleJoinRoom = async (roomId: string, isPrivate: boolean) => {
    // If player is already in this room, just navigate to it
    if (isPlayerInRoom(roomId)) {
      // handleGoToRoom(roomId);
      return;
    }

    if (!isAuthenticated) {
      toast.error("You need to be logged in to join a room");
      router.push("/login");
      return;
    }

    if (!isConnected) {
      toast.error("You are not connected to the server");
      return;
    }

    // Find the selected room for password dialog
    const room = filteredRooms.find((room) => room.roomId === roomId);
    if (!room) return;

    // If the room is private, show password dialog
    if (isPrivate) {
      setSelectedRoom(room);
      setPasswordDialogOpen(true);
      return;
    }

    // If not private, join directly
    joinSelectedRoom(roomId);
  };

  const joinSelectedRoom = async (roomId: string, password?: string) => {
    setJoiningRoom(roomId);
    try {
      // Join the room using socket provider with the JoinRoomDto format
      const room = await joinRoom(roomId, password);

      // Success! Navigate to the game room page
      // router.push(`/game-room/${roomId}`);
    } catch (error) {
      console.error("Failed to join room:", error);
      // Common error cases from backend
      if (error instanceof Error) {
        if (error.message.includes("full")) {
          toast.error("This room is full");
        } else if (error.message.includes("Invalid password")) {
          toast.error("Invalid password");
        } else if (error.message.includes("already in progress")) {
          toast.error("Game is already in progress");
        } else {
          toast.error(error.message);
        }
      }
    } finally {
      setJoiningRoom(null);
      setRoomPassword("");
      setPasswordDialogOpen(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;

    if (!roomPassword.trim()) {
      toast.error("Password is required for private rooms");
      return;
    }

    joinSelectedRoom(selectedRoom.roomId, roomPassword);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
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

  return (
    <>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center">
            <Paintbrush className="mr-2 h-6 w-6 text-amber-600" />
            <h2 className="text-2xl font-bold text-amber-800">
              Available Drawing Rooms{" "}
              {filteredRooms.length > 0 && `(${filteredRooms.length})`}
            </h2>
          </div>
          <div className="flex w-full items-center gap-4 md:w-fit">
            <Button
              onClick={() => router.push("/create-room")}
              className="w-full rounded-full border-2 border-amber-600 bg-amber-500 font-medium text-white shadow-md transition-all hover:bg-amber-600 hover:shadow-lg md:w-fit"
              disabled={!isConnected}
            >
              <Plus className="h-5 w-5" />
              Create New Room
            </Button>

            {/* <Button
              variant="outline"
              size="sm"
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
              onClick={handleRefresh}
              disabled={isRefreshing || !isConnected}
            >
              <RefreshCw
                className={`mr-1 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button> */}
          </div>
        </div>

        {/* Search/Filter Controls */}
        <div className="mb-6 rounded-xl border-4 border-dashed border-amber-500 bg-[#fffdf7] p-4 shadow-md">
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-amber-600" />
              <Input
                placeholder="Search rooms by name or host..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="border-amber-300 bg-white pl-9 focus-visible:ring-amber-500"
              />
            </div>

            <div className="flex w-full items-center space-x-2 md:w-auto">
              <Select value={roomStatus} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full border-amber-300 bg-white focus:ring-amber-500 md:w-[180px]">
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4 text-amber-600" />
                    <SelectValue placeholder="Filter by status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rooms</SelectItem>
                  <SelectItem value="WAITING">Open to Join</SelectItem>
                  <SelectItem value="PLAYING">In Progress</SelectItem>
                </SelectContent>
              </Select>

              {/* Clear filters button */}
              <Button
                variant="outline"
                onClick={resetFilters}
                className="border-amber-300 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                title="Clear all filters"
              >
                <X className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline">Clear</span>
              </Button>
            </div>
          </div>
        </div>

        {!isConnected ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-8 text-center">
            <p className="mb-2 text-amber-700">
              Currently offline. Please reconnect to see available rooms.
            </p>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="rounded-md border border-blue-200 bg-blue-50 p-8 text-center">
            <p className="mb-2 text-blue-700">
              No drawing rooms available right now.
            </p>
            <p className="text-sm text-blue-600">
              Be the first to create a new room and invite others to join!
            </p>
          </div>
        ) : (
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
                isPrivate={room.isPrivate}
                onJoinRoom={(roomId, isPrivate) =>
                  handleJoinRoom(roomId, isPrivate)
                }
                onLeaveRoom={(roomId) => handleLeaveRoom(roomId)}
                isLoading={joiningRoom === room.roomId}
                isJoined={isPlayerInRoom(room.roomId)}
                isOwner={user?.id === room.ownerId}
              />
            ))}
          </div>
        )}
      </div>

      {/* Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="border-4 border-dashed border-amber-400 bg-[#fffdf7] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-800">
              <Lock className="h-5 w-5 text-amber-600" />
              Private Room: {selectedRoom?.roomName}
            </DialogTitle>
            <DialogDescription className="text-amber-600">
              This room requires a password to join.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordSubmit}>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="room-password" className="text-amber-700">
                  Room Password
                </Label>
                <Input
                  id="room-password"
                  type="password"
                  value={roomPassword}
                  onChange={(e) => setRoomPassword(e.target.value)}
                  placeholder="Enter room password"
                  autoComplete="off"
                  className="border-amber-300 bg-white/80 focus-visible:ring-amber-500"
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPasswordDialogOpen(false)}
                className="border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="rounded-full border-2 border-amber-600 bg-amber-500 font-medium text-white shadow-md transition-all hover:bg-amber-600 hover:shadow-lg"
                disabled={joiningRoom === selectedRoom?.roomId}
              >
                {joiningRoom === selectedRoom?.roomId ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  "Join Room"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
