"use client";

import { useState } from "react";
import { Paintbrush, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

import CreateRoomForm from "../create-room/create-room-form";
import RoomPreviewCard from "./room-preview-card";

interface Room {
  roomId: string;
  roomName: string;
  hostName: string;
  hostAvatar?: string;
  players: number;
  maxPlayers: number;
  drawTime: number;
  rounds: number;
  status: "waiting" | "in-progress" | "completed";
}

export default function RoomList() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [rooms] = useState<Room[]>([
    {
      roomId: "room-123",
      roomName: "Artistic Doodlers",
      hostName: "CreativeMind",
      players: 3,
      maxPlayers: 8,
      drawTime: 80,
      rounds: 3,
      status: "waiting",
    },
    {
      roomId: "room-456",
      roomName: "Sketch Masters",
      hostName: "PicassoFan",
      players: 6,
      maxPlayers: 8,
      drawTime: 60,
      rounds: 5,
      status: "in-progress",
    },
    {
      roomId: "room-789",
      roomName: "Doodle Squad",
      hostName: "ArtisticSoul",
      players: 4,
      maxPlayers: 6,
      drawTime: 120,
      rounds: 4,
      status: "waiting",
    },
    {
      roomId: "room-101",
      roomName: "Creative Corner",
      hostName: "DrawingPro",
      players: 8,
      maxPlayers: 8,
      drawTime: 90,
      rounds: 3,
      status: "in-progress",
    },
  ]);

  const handleJoinRoom = (roomId: string) => {
    console.log(`Joining room: ${roomId}`);
    // Add your join room logic here
  };

  const handleRefresh = () => {
    console.log("Refreshing room list");
    // Add your refresh logic here
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Paintbrush className="mr-2 h-6 w-6 text-amber-600" />
          <h2 className="text-2xl font-bold text-amber-800">
            Available Drawing Rooms
          </h2>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-amber-300 text-amber-700 hover:bg-amber-50"
            onClick={handleRefresh}
          >
            <RefreshCw className="mr-1 h-4 w-4" />
            Refresh
          </Button>
          <Button
            size="sm"
            className="bg-amber-500 text-white hover:bg-amber-600"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? (
              "Cancel"
            ) : (
              <>
                <Plus className="mr-1 h-4 w-4" />
                Create Room
              </>
            )}
          </Button>
        </div>
      </div>

      {showCreateForm ? (
        <div className="mb-8">
          <CreateRoomForm />
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room) => (
          <RoomPreviewCard
            key={room.roomId}
            roomId={room.roomId}
            roomName={room.roomName}
            hostName={room.hostName}
            hostAvatar={room.hostAvatar}
            players={room.players}
            maxPlayers={room.maxPlayers}
            drawTime={room.drawTime}
            rounds={room.rounds}
            status={room.status}
            onJoin={handleJoinRoom}
          />
        ))}
      </div>

      {rooms.length === 0 && (
        <div className="mt-8 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 p-8 text-center">
          <div className="mb-4 rounded-full bg-amber-100 p-3">
            <Paintbrush className="h-8 w-8 text-amber-600" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-amber-800">
            No Drawing Rooms Available
          </h3>
          <p className="mb-4 text-amber-700">
            Be the first to create a room and start drawing!
          </p>
          <Button
            className="bg-amber-500 text-white hover:bg-amber-600"
            onClick={() => setShowCreateForm(true)}
          >
            <Plus className="mr-1 h-4 w-4" />
            Create a Room
          </Button>
        </div>
      )}
    </div>
  );
}
