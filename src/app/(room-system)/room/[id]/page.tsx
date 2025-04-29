"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSocket } from "@/lib/providers/socket-provider";
import { Room } from "@/lib/services/socket.service";
import { useAuthContext } from "@/lib/providers/auth-provider";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Loader2,
  Users,
  Clock,
  Lock,
  Unlock,
  LogOut,
  Play,
  Crown,
} from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export default function RoomPage() {
  const { id } = useParams<{ id: string }>();
  const { currentRoom, leaveRoom, isConnected, connecting } = useSocket();
  const { user } = useAuthContext();
  const [isLeaving, setIsLeaving] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const router = useRouter();

  // Check if the room exists
  useEffect(() => {
    // If connected to socket but no current room, go back to homepage
    if (isConnected && !connecting && !currentRoom) {
      router.push("/");
    }
  }, [currentRoom, isConnected, connecting, router]);

  // Check if the user is the room owner
  const isRoomOwner = currentRoom?.ownerId === user?.id;

  const handleLeaveRoom = async () => {
    setIsLeaving(true);
    try {
      await leaveRoom(id);
      toast.success("Left room successfully");
      router.push("/");
    } catch (err) {
      toast.error("Failed to leave room");
    } finally {
      setIsLeaving(false);
    }
  };

  const handleStartGame = async () => {
    setIsStarting(true);
    try {
      // TODO: Implement start game functionality
      toast.info("Starting game...");
      setTimeout(() => {
        toast.success("Game started!");
        setIsStarting(false);
      }, 1500);
    } catch (err) {
      toast.error("Failed to start game");
      setIsStarting(false);
    }
  };

  if (connecting) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="text-primary h-8 w-8 animate-spin" />
          <p>Connecting to game server...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto flex h-screen flex-col items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-bold">Connection Error</h2>
          <p className="text-muted-foreground mb-4">
            Failed to connect to game server. Please check your connection and
            try again.
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="outline" asChild>
              <Link href="/">Go Back</Link>
            </Button>
            <Button onClick={() => window.location.reload()}>Reconnect</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentRoom) {
    return (
      <div className="container mx-auto flex h-screen flex-col items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-bold">Room Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The room you&apos;re trying to view doesn&apos;t exist or has been
            closed.
          </p>
          <Button asChild>
            <Link href="/">Go Back to Rooms</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          asChild
          className="gap-2"
          onClick={handleLeaveRoom}
        >
          <div>
            <ArrowLeft className="h-4 w-4" />
            Back to Rooms
          </div>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Room Info */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-2xl">{currentRoom.name}</CardTitle>
                <CardDescription>Game Room</CardDescription>
              </div>
              <Badge
                variant={currentRoom.isPrivate ? "destructive" : "secondary"}
              >
                {currentRoom.isPrivate ? (
                  <Lock className="mr-1 h-3 w-3" />
                ) : (
                  <Unlock className="mr-1 h-3 w-3" />
                )}
                {currentRoom.isPrivate ? "Private" : "Public"}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Users className="text-muted-foreground h-4 w-4" />
                  <span>
                    Players: {currentRoom.users.length}/{currentRoom.maxPlayers}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="text-muted-foreground h-4 w-4" />
                  <span>Rounds: {currentRoom.rounds}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-normal">
                    {currentRoom.status}
                  </Badge>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <h3 className="font-medium">Room Controls</h3>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleLeaveRoom}
                    disabled={isLeaving}
                    className="gap-2"
                  >
                    {isLeaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="h-4 w-4" />
                    )}
                    Leave Room
                  </Button>

                  {isRoomOwner && currentRoom.status === "WAITING" && (
                    <Button
                      size="sm"
                      onClick={handleStartGame}
                      disabled={isStarting || currentRoom.users.length < 2}
                      className="gap-2"
                    >
                      {isStarting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                      Start Game
                    </Button>
                  )}
                </div>

                {isRoomOwner &&
                  currentRoom.users.length < 2 &&
                  currentRoom.status === "WAITING" && (
                    <p className="text-muted-foreground text-xs">
                      Need at least 2 players to start the game
                    </p>
                  )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Players List */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-xl">Players</CardTitle>
              <CardDescription>
                {currentRoom.users.length} of {currentRoom.maxPlayers} players
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {currentRoom.users.map((userRoom) => (
                  <li
                    key={userRoom.id}
                    className="hover:bg-accent flex items-center justify-between rounded-md p-2"
                  >
                    <div className="flex items-center gap-2">
                      {userRoom.userId === currentRoom.ownerId && (
                        <Crown className="h-4 w-4 text-yellow-500" />
                      )}
                      <span
                        className={`font-medium ${userRoom.userId === user?.id ? "text-primary" : ""}`}
                      >
                        {userRoom.user.username}
                      </span>
                    </div>
                    {userRoom.userId === user?.id && (
                      <Badge variant="outline">You</Badge>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="bg-muted/50 border-t px-6 py-3">
              <p className="text-muted-foreground text-xs">
                Room ID: {currentRoom.id}
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
