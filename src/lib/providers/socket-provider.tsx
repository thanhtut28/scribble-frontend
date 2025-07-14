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
import { socketService, Room, SocketError } from "../services/socket.service";
import { authRoutes, useAuth } from "./auth-provider";
import { toast } from "sonner";
import { usePathname } from "next/navigation";

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
  toggleReady: (roomId: string) => Promise<Room>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, handleAuthError, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const pathname = usePathname();

  // Handle socket auth errors
  const handleSocketAuthError = useCallback(
    (error: SocketError) => {
      console.error("Socket authentication error:", error);
      handleAuthError(error);
    },
    [handleAuthError],
  );

  // Set up socket event handlers
  const setupSocketEventHandlers = useCallback(() => {
    // Register to socket auth error events
    socketService.onAuthError(handleSocketAuthError);

    // Setup rooms events
    socketService.onRooms((updatedRooms) => {
      console.log("Rooms updated:", updatedRooms.length);
      setRooms(updatedRooms);

      const _currentRoom = updatedRooms.find((r) =>
        r.users.some((u) => u.userId === user?.id),
      );

      if (_currentRoom) {
        console.log("Updating current room from rooms event:", _currentRoom.id);
        setCurrentRoom(_currentRoom);
      }

      // If we have a current room, update it from the rooms list
      if (currentRoom) {
        const updatedCurrentRoom = updatedRooms.find(
          (r) => r.id === currentRoom.id,
        );
        if (updatedCurrentRoom) {
          console.log(
            "Updating current room from rooms event:",
            updatedCurrentRoom.id,
          );
          setCurrentRoom(updatedCurrentRoom);
        }
      }
    });

    // Add player ready changed event handler
    socketService.onPlayerReadyChanged(({ room, userId, isReady }) => {
      console.log(
        `User ${userId} ready status changed to ${isReady} in room ${room.id}`,
      );

      // Update rooms list
      setRooms((prev) => prev.map((r) => (r.id === room.id ? room : r)));

      // If this is the current room, update it
      if (currentRoom?.id === room.id) {
        console.log(
          "Updating current room from playerReadyChanged event:",
          room.id,
        );
        setCurrentRoom(room);
      }

      // Get the user's name if possible
      const readyUser = room.users.find((u) => u.userId === userId);
      if (readyUser) {
        toast.info(
          `${readyUser.user.username} is ${isReady ? "ready" : "not ready"} to play.`,
        );
      }
    });

    socketService.onRoomCreated((room) => {
      console.log("Room created:", room.name);

      // Add to rooms list if it's not the current user's room
      if (!currentRoom || currentRoom.id !== room.id) {
        setCurrentRoom(room);
        setRooms((prev) => {
          // Check if room already exists in the list
          if (prev.some((r) => r.id === room.id)) {
            return prev;
          }
          return [...prev, room];
        });
        toast.success(`Room "${room.name}" created.`);
      }
    });

    socketService.onUserJoined(({ room, userId }) => {
      console.log(`User ${userId} joined room ${room.id}`);

      // Update rooms list
      setRooms((prev) => prev.map((r) => (r.id === room.id ? room : r)));

      // If this is the current room, update it
      if (currentRoom?.id === room.id) {
        console.log("Updating current room from userJoined event:", room.id);
        setCurrentRoom(room);
      }

      // Only show toast if it's not the current user joining
      const currentUserId = currentRoom?.users.find((u) => u.isReady)?.userId;

      if (userId !== currentUserId) {
        // Get the joined user's name if possible
        const joinedUser = room.users.find((u) => u.userId === userId);
        if (joinedUser) {
          toast.info(`${joinedUser.user.username} joined the room.`);
        }
      }
    });

    socketService.onUserLeft(({ room, userId }) => {
      console.log(`User ${userId} left room ${room.id}`);

      // Update rooms list
      setRooms((prev) => prev.map((r) => (r.id === room.id ? room : r)));

      // If this is the current room, update it
      if (currentRoom?.id === room.id) {
        console.log("Updating current room from userLeft event:", room.id);
        setCurrentRoom(room);
      }

      // Only show toast if it's not the current user leaving
      const currentUserId = currentRoom?.users.find((u) => u.isReady)?.userId;

      if (userId !== currentUserId) {
        // Get the left user's info
        const leftUser = currentRoom?.users.find((u) => u.userId === userId);
        if (leftUser) {
          toast.info(`${leftUser.user.username} left the room.`);
        }
      }
    });

    // Handle game events
    socketService.onGameStarted((room) => {
      if (currentRoom?.id === room.id) {
        console.log("Updating current room from gameStarted event:", room.id);
        setCurrentRoom(room);
        toast.success("Game started!");
      }

      // Update rooms list
      setRooms((prev) => prev.map((r) => (r.id === room.id ? room : r)));
    });

    socketService.onGameEnded((room) => {
      if (currentRoom?.id === room.id) {
        console.log("Updating current room from gameEnded event:", room.id);
        setCurrentRoom(room);
        toast.success("Game ended!");
      }

      // Update rooms list
      setRooms((prev) => prev.map((r) => (r.id === room.id ? room : r)));
    });
  }, [currentRoom, handleSocketAuthError, user]);

  const refreshRooms = async () => {
    // Don't try to refresh if we're not connected and don't retry connection here
    if (!isConnected) {
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

      // Check if this is an auth error
      if (
        err instanceof Error &&
        (err.message.includes("authentication") ||
          err.message.includes("token") ||
          err.message.includes("expired"))
      ) {
        handleAuthError({
          code: "AUTH_FAILED",
          message: err.message,
          redirectTo: "/login",
        });
      }
      // Mark as disconnected if we got a Socket not connected error
      else if (
        err instanceof Error &&
        err.message.includes("Socket not connected")
      ) {
        console.error("Socket appears to be disconnected");
        setIsConnected(false);
        toast.error("Lost connection to server. Please reconnect manually.");
      }
    }
  };

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
      // Clear previous room state on new connection attempt
      setCurrentRoom(null);

      // Attempt to connect
      const socket = await socketService.connect();
      console.log("Socket connection successful");
      setSocket(socket);
      setIsConnected(true);

      // Always set up event handlers after successful connection
      setupSocketEventHandlers();

      // Fetch initial rooms
      await refreshRooms();
    } catch (err) {
      console.error("Socket connection error:", err);
      setError(err instanceof Error ? err : new Error("Failed to connect"));
      setIsConnected(false);
      setSocket(null);

      // Check if this is an auth error
      if (
        err instanceof Error &&
        (err.message.includes("authentication") ||
          err.message.includes("token") ||
          err.message.includes("expired"))
      ) {
        handleAuthError({
          code: "AUTH_FAILED",
          message: err.message,
          redirectTo: "/login",
        });
      }
    } finally {
      setConnecting(false);
    }
  }, [
    isAuthenticated,
    connecting,
    handleAuthError,
    setupSocketEventHandlers,
    refreshRooms,
    isConnected,
  ]);

  const disconnect = useCallback(() => {
    // Clean up socket event handlers
    socketService.disconnect();
    setSocket(null);
    setIsConnected(false);
    setCurrentRoom(null);
  }, []);

  const createRoom = async (name: string, options = {}) => {
    try {
      // Don't show duplicate toast messages from event handlers
      let creationSuccessful = false;

      console.log(
        "Creating room:",
        name,
        "Current room before:",
        currentRoom?.id,
      );

      const room = await socketService.createRoom({
        name,
        ...options,
      });

      // Mark the operation as successful to prevent duplicate success messages from socket events
      creationSuccessful = true;

      console.log("Room creation successful, room data:", room);

      // Always update current room when creation is successful
      setCurrentRoom(room);
      console.log("Current room set to:", room.id);

      // Add toast success message
      toast.success(`Room "${room.name}" created successfully`);

      return room;
    } catch (err) {
      // Check if this is an auth error
      if (
        err instanceof Error &&
        (err.message.includes("authentication") ||
          err.message.includes("token") ||
          err.message.includes("expired"))
      ) {
        handleAuthError({
          code: "AUTH_FAILED",
          message: err.message,
          redirectTo: "/login",
        });
        throw err;
      }

      const errorMessage =
        err instanceof Error ? err.message : "Failed to create room";
      toast.error(errorMessage);
      throw err;
    }
  };

  const joinRoom = async (roomId: string, password?: string) => {
    try {
      // Don't show duplicate toast messages from event handlers
      let joinSuccessful = false;

      console.log(
        "Joining room:",
        roomId,
        "Current room before:",
        currentRoom?.id,
      );

      const room = await socketService.joinRoom({
        roomId,
        password,
      });

      // Mark the operation as successful to prevent duplicate success messages from socket events
      joinSuccessful = true;

      console.log("Join successful, room data:", room);

      // Always update current room when join is successful
      setCurrentRoom(room);
      console.log("Current room set to:", room.id);

      // Add toast success message
      toast.success(`Joined room "${room.name}"`);

      return room;
    } catch (err) {
      // Check if this is an auth error
      if (
        err instanceof Error &&
        (err.message.includes("authentication") ||
          err.message.includes("token") ||
          err.message.includes("expired"))
      ) {
        handleAuthError({
          code: "AUTH_FAILED",
          message: err.message,
          redirectTo: "/login",
        });
        throw err;
      }

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
      // Check if this is an auth error
      if (
        err instanceof Error &&
        (err.message.includes("authentication") ||
          err.message.includes("token") ||
          err.message.includes("expired"))
      ) {
        handleAuthError({
          code: "AUTH_FAILED",
          message: err.message,
          redirectTo: "/login",
        });
        return;
      }

      const errorMessage =
        err instanceof Error ? err.message : "Failed to leave room";
      toast.error(errorMessage);
      throw err;
    }
  };

  const toggleReady = async (roomId: string) => {
    try {
      console.log("Toggling ready state in room:", roomId);

      const room = await socketService.toggleReady(roomId);
      console.log("Toggle ready successful, room data:", room);

      // Update current room
      setCurrentRoom(room);

      // The user's ready state
      const currentUser = room.users.find((u) => u.userId === user?.id);
      if (currentUser) {
        toast.success(
          `You are ${currentUser.isReady ? "ready" : "not ready"} to play`,
        );
      }

      return room;
    } catch (err) {
      // Check if this is an auth error
      if (
        err instanceof Error &&
        (err.message.includes("authentication") ||
          err.message.includes("token") ||
          err.message.includes("expired"))
      ) {
        handleAuthError({
          code: "AUTH_FAILED",
          message: err.message,
          redirectTo: "/login",
        });
        throw err;
      }

      const errorMessage =
        err instanceof Error ? err.message : "Failed to toggle ready state";
      toast.error(errorMessage);
      throw err;
    }
  };

  // Connect when authenticated
  useEffect(() => {
    // Skip connecting on auth routes
    if (typeof window !== "undefined" && authRoutes.includes(pathname)) {
      return;
    }

    if (isAuthenticated && !isConnected && !connecting) {
      connect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Disconnect when not authenticated
  useEffect(() => {
    if (!isAuthenticated && isConnected) {
      disconnect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SocketContext.Provider
      value={{
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
        toggleReady,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
