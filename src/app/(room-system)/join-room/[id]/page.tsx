"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSocket } from "@/lib/providers/socket-provider";
import { Room } from "@/lib/services/socket.service";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Loader2, Lock } from "lucide-react";
import Link from "next/link";

export default function JoinRoomPage() {
  const { id } = useParams<{ id: string }>();
  const { joinRoom, isConnected, connecting, rooms } = useSocket();
  const [room, setRoom] = useState<Room | null>(null);
  const [password, setPassword] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Find the room in the list of rooms
  useEffect(() => {
    if (rooms.length > 0) {
      const foundRoom = rooms.find((r) => r.id === id);
      setRoom(foundRoom || null);
    }
  }, [id, rooms]);

  const handleJoinRoom = async () => {
    setError(null);
    setIsJoining(true);

    try {
      await joinRoom(id, room?.isPrivate ? password : undefined);
      toast.success("Joined room successfully!");
      router.push(`/room/${id}`);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to join room";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsJoining(false);
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

  if (!room) {
    return (
      <div className="container mx-auto flex h-screen flex-col items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-bold">Room Not Found</h2>
          <p className="text-muted-foreground mb-4">
            {`The room you're trying to join doesn't exist or has been closed.`}
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
      <div className="mx-auto max-w-md">
        <div className="mb-6">
          <Button variant="ghost" asChild className="gap-2">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Back to Rooms
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Join Room: {room.name}</CardTitle>
            <CardDescription>
              {room.isPrivate
                ? "This is a private room. Please enter the password to join."
                : "Click the button below to join this room."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {room.isPrivate && (
              <div className="mb-4 space-y-2">
                <div className="flex items-center space-x-2">
                  <Lock className="text-muted-foreground h-4 w-4" />
                  <label htmlFor="password" className="text-sm font-medium">
                    Room Password
                  </label>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter room password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {error && <p className="text-destructive text-sm">{error}</p>}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={handleJoinRoom}
              disabled={isJoining || (room.isPrivate && !password)}
            >
              {isJoining ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                "Join Room"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
