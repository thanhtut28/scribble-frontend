import { io, Socket } from "socket.io-client";
import Cookies from "js-cookie";

// Types for room-related events
export interface Room {
  id: string;
  name: string;
  maxPlayers: number;
  rounds: number;
  isPrivate: boolean;
  status: "WAITING" | "PLAYING" | "FINISHED";
  ownerId: string;
  users: RoomUser[];
  createdAt: string;
  updatedAt: string;
}

export interface RoomUser {
  id: string;
  userId: string;
  roomId: string;
  isReady: boolean;
  joinedAt: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
}

export interface CreateRoomOptions {
  name: string;
  maxPlayers?: number;
  rounds?: number;
  isPrivate?: boolean;
  password?: string;
}

export interface JoinRoomOptions {
  roomId: string;
  password?: string;
}

class SocketService {
  private socket: Socket | null = null;
  private socketUrl =
    process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

  // Initialize socket connection
  connect(): Promise<Socket> {
    return new Promise((resolve, reject) => {
      const token = Cookies.get("accessToken");

      if (!token) {
        reject(new Error("No authentication token found"));
        return;
      }

      console.log(
        "Attempting to connect with token:",
        token.substring(0, 10) + "...",
      );
      console.log("Socket URL:", `${this.socketUrl}/rooms`);

      // Use the exact configuration from the README example but with timeout
      this.socket = io(`${this.socketUrl}/rooms`, {
        transports: ["websocket"], // Only websocket as specified in README
        auth: { token }, // Pass token exactly as shown in README
        timeout: 20000, // Increase timeout to 20 seconds
        reconnection: false, // Explicitly disable auto-reconnection
      });

      // Add a manual timeout to the connection attempt
      const connectionTimeout = setTimeout(() => {
        if (this.socket && !this.socket.connected) {
          console.error("Socket connection timeout after 20 seconds");
          this.socket.close();
          reject(new Error("Connection timeout"));
        }
      }, 20000);

      this.socket.on("connect", () => {
        console.log("Socket connected successfully");
        clearTimeout(connectionTimeout);
        resolve(this.socket!);
      });

      this.socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        clearTimeout(connectionTimeout);
        reject(error);
      });

      this.socket.on("error", (error) => {
        console.error("Socket error:", error);
      });

      // Add more connection debug info
      this.socket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
      });

      this.socket.on("connected", (data) => {
        console.log("Connection acknowledged:", data);
      });
    });
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Check if socket is connected
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Get available rooms
  getRooms(): Promise<Room[]> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        console.error("Socket instance is null");
        reject(new Error("Socket not connected - no socket instance"));
        return;
      }

      if (!this.isConnected()) {
        console.error("Socket is not connected");
        reject(
          new Error("Socket not connected - socket exists but not connected"),
        );
        return;
      }

      console.log("Emitting getRooms event");

      // Set up a timeout for this specific request
      const requestTimeout = setTimeout(() => {
        console.error("getRooms request timed out after 5 seconds");
        reject(new Error("Request timeout - server did not respond"));
      }, 5000);

      this.socket.emit(
        "getRooms",
        (response: { error?: string; data?: Room[] }) => {
          // Clear the timeout as we got a response
          clearTimeout(requestTimeout);

          console.log(
            "getRooms response received:",
            response ? "has data" : "null",
          );

          if (!response) {
            console.error("Received null response from server");
            reject(new Error("Invalid response from server"));
            return;
          }

          if (response.error) {
            console.error("Error getting rooms:", response.error);
            reject(new Error(response.error));
          } else {
            // According to README, we expect { data: Room[] }
            const rooms = response.data || [];
            console.log(`Retrieved ${rooms.length} rooms`);
            resolve(rooms);
          }
        },
      );
    });
  }

  // Get specific room
  getRoom(roomId: string): Promise<Room> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected()) {
        reject(new Error("Socket not connected"));
        return;
      }

      this.socket.emit(
        "getRoom",
        roomId,
        (response: { error?: string; data?: Room }) => {
          if (response.error) {
            reject(new Error(response.error));
          } else if (!response.data) {
            reject(new Error("Room not found"));
          } else {
            resolve(response.data);
          }
        },
      );
    });
  }

  // Create a new room
  createRoom(options: CreateRoomOptions): Promise<Room> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected()) {
        reject(new Error("Socket not connected"));
        return;
      }

      this.socket.emit(
        "createRoom",
        options,
        (response: { error?: string; data?: Room }) => {
          if (response.error) {
            reject(new Error(response.error));
          } else if (!response.data) {
            reject(new Error("Failed to create room"));
          } else {
            resolve(response.data);
          }
        },
      );
    });
  }

  // Join a room
  joinRoom(options: JoinRoomOptions): Promise<Room> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected()) {
        reject(new Error("Socket not connected"));
        return;
      }

      this.socket.emit(
        "joinRoom",
        options,
        (response: { error?: string; data?: Room }) => {
          if (response.error) {
            reject(new Error(response.error));
          } else if (!response.data) {
            reject(new Error("Failed to join room"));
          } else {
            resolve(response.data);
          }
        },
      );
    });
  }

  // Leave a room
  leaveRoom(roomId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected()) {
        reject(new Error("Socket not connected"));
        return;
      }

      this.socket.emit("leaveRoom", roomId, (response: { error?: string }) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve();
        }
      });
    });
  }

  // Event listeners
  onRooms(callback: (rooms: Room[]) => void) {
    this.socket?.on("rooms", callback);
    return () => {
      this.socket?.off("rooms", callback);
    };
  }

  onRoomCreated(callback: (room: Room) => void) {
    this.socket?.on("roomCreated", callback);
    return () => {
      this.socket?.off("roomCreated", callback);
    };
  }

  onUserJoined(callback: (data: { room: Room; userId: string }) => void) {
    this.socket?.on("userJoined", callback);
    return () => {
      this.socket?.off("userJoined", callback);
    };
  }

  onUserLeft(callback: (data: { room: Room; userId: string }) => void) {
    this.socket?.on("userLeft", callback);
    return () => {
      this.socket?.off("userLeft", callback);
    };
  }

  onGameStarted(callback: (room: Room) => void) {
    this.socket?.on("gameStarted", callback);
    return () => {
      this.socket?.off("gameStarted", callback);
    };
  }

  onGameEnded(callback: (room: Room) => void) {
    this.socket?.on("gameEnded", callback);
    return () => {
      this.socket?.off("gameEnded", callback);
    };
  }
}

// Create a singleton instance
export const socketService = new SocketService();
