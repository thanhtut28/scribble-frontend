"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { Socket } from "socket.io-client";
import { socketService, Room } from "../services/socket.service";
import { useAuthContext } from "./auth-provider";
import { toast } from "sonner";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connecting: boolean;
  error: Error | null;
  rooms: Room[];
  currentRoom: Room | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshRooms: () => Promise<void>;
  createRoom: (
    name: string,
    options?: {
      maxPlayers?: number;
      rounds?: number;
      isPrivate?: boolean;
      password?: string;
    },
  ) => Promise<Room>;
  joinRoom: (roomId: string, password?: string) => Promise<Room>;
  leaveRoom: (roomId: string) => Promise<void>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, user } = useAuthContext();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);

  // Store event unsubscribe functions
  const [unsubscribeFunctions, setUnsubscribeFunctions] = useState<
    (() => void)[]
  >([]);

  // Connect to socket when authenticated
  const connect = useCallback(async (): Promise<void> => {
    if (!isAuthenticated) {
      console.log("Not attempting connection - user is not authenticated");
      return;
    }

    if (connecting) {
      console.log("Already attempting to connect, skipping");
      return;
    }

    console.log("Starting socket connection attempt...");
    setConnecting(true);
    setError(null);

    try {
      const socket = await socketService.connect();
      setSocket(socket);
      console.log("Socket connected in provider");
      setIsConnected(true);

      console.log("Fetching initial rooms...");
      await refreshRooms();
      console.log("Initial rooms fetched successfully");

      // Set up event listeners
      console.log("Setting up socket event listeners...");

      const unsubscribeRooms = socketService.onRooms((updatedRooms) => {
        console.log("Rooms updated:", updatedRooms.length);
        setRooms(updatedRooms);
      });

      const unsubscribeRoomCreated = socketService.onRoomCreated((room) => {
        console.log("Room created:", room.name);
        setRooms((prev) => [...prev, room]);
        toast.success(`Room "${room.name}" created.`);
      });

      const unsubscribeUserJoined = socketService.onUserJoined(
        ({ room, userId }) => {
          console.log(`User ${userId} joined room ${room.id}`);
          setRooms((prev) => prev.map((r) => (r.id === room.id ? room : r)));

          if (currentRoom?.id === room.id) {
            setCurrentRoom(room);
          }

          // If the current user is not the one who joined
          if (user?.id !== userId) {
            const joinedUser = room.users.find((u) => u.userId === userId);
            if (joinedUser) {
              toast.info(`${joinedUser.user.username} joined the room.`);
            }
          }
        },
      );

      const unsubscribeUserLeft = socketService.onUserLeft(
        ({ room, userId }) => {
          console.log(`User ${userId} left room ${room.id}`);
          setRooms((prev) => prev.map((r) => (r.id === room.id ? room : r)));

          if (currentRoom?.id === room.id) {
            setCurrentRoom(room);
          }

          const leftUser = currentRoom?.users.find((u) => u.userId === userId);
          if (leftUser && user?.id !== userId) {
            toast.info(`${leftUser.user.username} left the room.`);
          }
        },
      );

      // Store unsubscribe functions to call later when disconnecting
      setUnsubscribeFunctions([
        unsubscribeRooms,
        unsubscribeRoomCreated,
        unsubscribeUserJoined,
        unsubscribeUserLeft,
      ]);

      console.log("Socket setup complete");
    } catch (err) {
      console.error("Socket connection failed:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to connect to socket"),
      );
      toast.error("Failed to connect to game server.");
    } finally {
      setConnecting(false);
    }
  }, [
    isAuthenticated,
    connecting,
    currentRoom?.id,
    currentRoom?.users,
    user?.id,
  ]);

  const disconnect = useCallback(() => {
    // Call all unsubscribe functions
    unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
    setUnsubscribeFunctions([]);

    socketService.disconnect();
    setSocket(null);
    setIsConnected(false);
    setCurrentRoom(null);
  }, [unsubscribeFunctions]);

  const refreshRooms = async () => {
    // Don't try to refresh if we're not connected and don't retry connection here
    if (!isConnected) {
      // console.error("Cannot refresh rooms - socket not connected");
      setRooms([]);
      return;
    }

    try {
      // Get rooms from socket service with retry
      const getRoomsWithRetry = async (
        retries = 3,
        delay = 1000,
      ): Promise<Room[]> => {
        try {
          console.log(`Attempting to get rooms (retry ${3 - retries} of 3)...`);
          const response = await socketService.getRooms();
          console.log("Get rooms response:", response);
          return response || [];
        } catch (error) {
          if (retries > 0) {
            console.log(`Retrying getRooms in ${delay}ms...`);
            await new Promise((r) => setTimeout(r, delay));
            return getRoomsWithRetry(retries - 1, delay * 1.5);
          }
          throw error;
        }
      };

      // Try to get rooms with retry
      const rooms = await getRoomsWithRetry();
      console.log(`Retrieved ${rooms.length} rooms`);
      setRooms(rooms);
    } catch (err) {
      console.error("Failed to get rooms:", err);
      // Reset rooms to empty array on error
      setRooms([]);

      // Mark as disconnected if we got a Socket not connected error
      if (
        err instanceof Error &&
        err.message.includes("Socket not connected")
      ) {
        console.error("Socket appears to be disconnected");
        setIsConnected(false);
        toast.error("Lost connection to server. Please reconnect manually.");
      }
    }
  };

  const createRoom = async (name: string, options = {}) => {
    try {
      const room = await socketService.createRoom({
        name,
        ...options,
      });
      setCurrentRoom(room);
      return room;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create room";
      toast.error(errorMessage);
      throw err;
    }
  };

  const joinRoom = async (roomId: string, password?: string) => {
    try {
      const room = await socketService.joinRoom({
        roomId,
        password,
      });
      setCurrentRoom(room);
      return room;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to join room";
      toast.error(errorMessage);
      throw err;
    }
  };

  const leaveRoom = async (roomId: string) => {
    try {
      await socketService.leaveRoom(roomId);
      setCurrentRoom(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to leave room";
      toast.error(errorMessage);
      throw err;
    }
  };

  // Auto-connect when authenticated
  useEffect(() => {
    if (isAuthenticated && !isConnected && !connecting) {
      console.log("Attempting to connect to socket...");
      connect();
    }

    // Cleanup on unmount
    return () => {
      if (isConnected) {
        console.log("Disconnecting socket on cleanup");
        disconnect();
      }
    };
  }, [isAuthenticated, isConnected, connecting, connect, disconnect]);

  // Expose socket context to components
  const value = {
    socket,
    isConnected,
    connecting,
    error,
    rooms,
    currentRoom,
    connect,
    disconnect,
    refreshRooms,
    createRoom,
    joinRoom,
    leaveRoom,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
