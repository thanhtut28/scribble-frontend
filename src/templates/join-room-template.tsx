"use client";

import RoomList from "@/components/join-room/room-list";
import { Palette, Search, Filter, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUrlState } from "@/hooks/use-url-state";
import { useSocket } from "@/lib/providers/socket-provider";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const JoinRoomTemplate = () => {
  const [filters, setters, resetFilters] = useUrlState({
    search: "",
    roomStatus: "all",
  });
  const { refreshRooms, isConnected, connecting, connect } = useSocket();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [connectionAttempted, setConnectionAttempted] = useState(false);

  // Effect to ensure connection is established
  useEffect(() => {
    if (!isConnected && !connecting && !connectionAttempted) {
      console.log("Attempting to connect from JoinRoomTemplate");
      connect().catch((err) => {
        console.error("Connection failed:", err);
        toast.error("Failed to connect to the drawing server");
      });
      setConnectionAttempted(true);
    }
  }, [isConnected, connecting, connectionAttempted, connect]);

  // Destructure setters
  const { setSearch, setRoomStatus } = setters;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setConnectionAttempted(false); // Reset connection attempt flag to allow reconnection
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
            <Palette className="mr-2 h-8 w-8 text-amber-600" />
            <h1 className="font-comic text-4xl font-bold text-amber-800">
              Join a Drawing Room
            </h1>
          </div>
          <p className="text-amber-700">
            Find a room to showcase your artistic skills or join friends for a
            fun drawing session!
          </p>
        </div>

        {/* Controls */}
        <div className="mb-6 rounded-xl border-4 border-dashed border-amber-500 bg-[#fffdf7] p-4 shadow-md">
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-amber-600" />
              <Input
                placeholder="Search rooms by name or host..."
                value={filters.search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-amber-300 bg-white pl-9 focus-visible:ring-amber-500"
              />
            </div>

            <div className="flex w-full items-center space-x-2 md:w-auto">
              <Select value={filters.roomStatus} onValueChange={setRoomStatus}>
                <SelectTrigger className="w-full border-amber-300 bg-white focus:ring-amber-500 md:w-[180px]">
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4 text-amber-600" />
                    <SelectValue placeholder="Filter by status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rooms</SelectItem>
                  <SelectItem value="waiting">Open to Join</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                className="border-amber-300 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
              </Button>

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

        <RoomList />
      </div>
    </div>
  );
};

export default JoinRoomTemplate;
