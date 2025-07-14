import { io, Socket } from "socket.io-client";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

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

// Error types for handling socket errors
export interface SocketError {
  code?: string;
  message: string;
  redirectTo?: string;
}

// Create a global event for authentication errors
export const SOCKET_AUTH_ERROR_EVENT = "socket:auth:error";

class SocketService {
  private socket: Socket | null = null;
  private socketUrl =
    process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private authErrorHandlers: ((error: SocketError) => void)[] = [];

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
        reconnection: false, // Explicitly disable auto-reconnection to handle it manually
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
        this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
        resolve(this.socket!);
      });

      this.socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        clearTimeout(connectionTimeout);
        reject(error);
      });

      this.socket.on("error", (error: SocketError) => {
        console.error("Socket error:", error);
        this.handleSocketError(error);
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

    // Clear any reconnection timers
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  // Check if socket is connected
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Register auth error handler
  onAuthError(handler: (error: SocketError) => void) {
    this.authErrorHandlers.push(handler);
    return () => {
      this.authErrorHandlers = this.authErrorHandlers.filter(
        (h) => h !== handler,
      );
    };
  }

  // Handle socket errors, especially authentication errors
  private handleSocketError(error: SocketError) {
    // Handle token expiration and other auth errors
    if (error.code === "TOKEN_EXPIRED" || error.code === "AUTH_FAILED") {
      console.error(`Authentication error: ${error.message}`);

      // Notify all registered error handlers
      this.authErrorHandlers.forEach((handler) => handler(error));

      // Dispatch global event for auth errors
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent(SOCKET_AUTH_ERROR_EVENT, {
            detail: error,
          }),
        );
      }

      // Disconnect the socket
      this.disconnect();
    }
  }

  // Try to reconnect the socket
  reconnect(): Promise<Socket> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return Promise.reject(new Error("Maximum reconnection attempts reached"));
    }

    this.reconnectAttempts++;
    console.log(
      `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`,
    );

    return this.connect();
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
        (response: { error?: string; data?: Room; redirectTo?: string }) => {
          if (response.error) {
            // Check if this is an auth error with redirect
            if (response.redirectTo) {
              this.handleSocketError({
                code: "AUTH_FAILED",
                message: response.error,
                redirectTo: response.redirectTo,
              });
            }
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

      interface ServerResponse {
        error?: string;
        redirectTo?: string;
        data?: Room;
        id?: string;
        name?: string;
        maxPlayers?: number;
        rounds?: number;
        isPrivate?: boolean;
        status?: string;
        ownerId?: string;
        users?: RoomUser[];
        createdAt?: string;
        updatedAt?: string;
      }

      try {
        this.socket.emit("createRoom", options, (response: ServerResponse) => {
          try {
            // Handle null or undefined response
            if (!response) {
              console.error("Null response received from server");
              reject(new Error("Invalid response from server: null response"));
              return;
            }

            if (response.error) {
              // Check if this is an auth error with redirect
              if (response.redirectTo) {
                this.handleSocketError({
                  code: "AUTH_FAILED",
                  message: response.error,
                  redirectTo: response.redirectTo,
                });
              }
              reject(new Error(response.error));
              return;
            }

            // Either directly get data from response.data or reconstruct from fields
            const roomData = response.data || {
              id: response.id,
              name: response.name,
              maxPlayers: response.maxPlayers || 8,
              rounds: response.rounds || 3,
              isPrivate: response.isPrivate || false,
              status: response.status || "WAITING",
              ownerId: response.ownerId || "",
              users: response.users || [],
              createdAt: response.createdAt || new Date().toISOString(),
              updatedAt: response.updatedAt || new Date().toISOString(),
            };

            // Validate room data
            if (!roomData.id) {
              console.error("Invalid room data:", roomData);
              reject(new Error("Invalid room data returned from server"));
              return;
            }

            resolve(roomData as Room);
          } catch (callbackError: unknown) {
            const errorMessage =
              callbackError instanceof Error
                ? callbackError.message
                : "Unknown error";
            console.error(
              "Error processing createRoom response:",
              callbackError,
            );
            reject(
              new Error(`Error processing server response: ${errorMessage}`),
            );
          }
        });
      } catch (emitError: unknown) {
        const errorMessage =
          emitError instanceof Error ? emitError.message : "Unknown error";
        console.error("Error emitting createRoom event:", emitError);
        reject(new Error(`Socket emit error: ${errorMessage}`));
      }
    });
  }

  // Join a room
  joinRoom(options: JoinRoomOptions): Promise<Room> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected()) {
        reject(new Error("Socket not connected"));
        return;
      }

      interface ServerResponse {
        error?: string;
        redirectTo?: string;
        data?: Room;
        id?: string;
        name?: string;
        maxPlayers?: number;
        rounds?: number;
        isPrivate?: boolean;
        status?: string;
        ownerId?: string;
        users?: RoomUser[];
        createdAt?: string;
        updatedAt?: string;
      }

      this.socket.emit("joinRoom", options, (response: unknown) => {
        console.log("Join room response:", response);

        // Handle different response formats
        if (!response) {
          reject(new Error("No response from server"));
          return;
        }

        // Type guard
        const responseObj = response as ServerResponse;

        // Handle error case
        if (responseObj.error) {
          // Check if this is an auth error with redirect
          if (responseObj.redirectTo) {
            this.handleSocketError({
              code: "AUTH_FAILED",
              message: responseObj.error,
              redirectTo: responseObj.redirectTo,
            });
          }
          reject(new Error(responseObj.error));
          return;
        }

        // Backend might return the room directly or nested in a data property
        const roomData = responseObj.data || responseObj;

        if (!roomData || !roomData.id) {
          reject(new Error("Failed to join room: Invalid response format"));
          return;
        }

        resolve(roomData as Room);
      });
    });
  }

  // Leave a room
  leaveRoom(roomId: string): Promise<Room | { message: string }> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected()) {
        reject(new Error("Socket not connected"));
        return;
      }

      interface ServerResponse {
        error?: string;
        redirectTo?: string;
        data?: Room | { message: string };
        id?: string;
        name?: string;
        maxPlayers?: number;
        rounds?: number;
        isPrivate?: boolean;
        status?: string;
        ownerId?: string;
        users?: RoomUser[];
        createdAt?: string;
        updatedAt?: string;
        message?: string;
      }

      this.socket.emit("leaveRoom", roomId, (response: unknown) => {
        console.log("Leave room response:", response);

        // Handle different response formats
        if (!response) {
          reject(new Error("No response from server"));
          return;
        }

        // Type guard
        const responseObj = response as ServerResponse;

        // Handle error case
        if (responseObj.error) {
          // Check if this is an auth error with redirect
          if (responseObj.redirectTo) {
            this.handleSocketError({
              code: "AUTH_FAILED",
              message: responseObj.error,
              redirectTo: responseObj.redirectTo,
            });
          }
          reject(new Error(responseObj.error));
          return;
        }

        // Backend might return the room directly or nested in a data property
        const responseData = responseObj.data || responseObj;

        // Could be room object or message object
        if (!responseData) {
          reject(new Error("Failed to leave room: Invalid response format"));
          return;
        }

        resolve(responseData as Room | { message: string });
      });
    });
  }

  // Toggle ready status for the current user in a room
  toggleReady(roomId: string): Promise<Room> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected()) {
        reject(new Error("Socket not connected"));
        return;
      }

      interface ServerResponse {
        error?: string;
        redirectTo?: string;
        data?: Room;
        id?: string;
        name?: string;
        maxPlayers?: number;
        rounds?: number;
        isPrivate?: boolean;
        status?: string;
        ownerId?: string;
        users?: RoomUser[];
        createdAt?: string;
        updatedAt?: string;
      }

      this.socket.emit("toggleReady", roomId, (response: unknown) => {
        console.log("Toggle ready response:", response);

        // Handle different response formats
        if (!response) {
          reject(new Error("No response from server"));
          return;
        }

        // Type guard
        const responseObj = response as ServerResponse;

        // Handle error case
        if (responseObj.error) {
          // Check if this is an auth error with redirect
          if (responseObj.redirectTo) {
            this.handleSocketError({
              code: "AUTH_FAILED",
              message: responseObj.error,
              redirectTo: responseObj.redirectTo,
            });
          }
          reject(new Error(responseObj.error));
          return;
        }

        // Backend might return the room directly or nested in a data property
        const roomData = responseObj.data || responseObj;

        if (!roomData || !roomData.id) {
          reject(
            new Error("Failed to toggle ready state: Invalid response format"),
          );
          return;
        }

        resolve(roomData as Room);
      });
    });
  }

  // Set up event listeners for room updates
  onRooms(callback: (rooms: Room[]) => void) {
    if (this.socket) {
      this.socket.on("rooms", callback);
    }
  }

  onRoomCreated(callback: (room: Room) => void) {
    if (this.socket) {
      this.socket.on("roomCreated", callback);
    }
  }

  onUserJoined(callback: (data: { room: Room; userId: string }) => void) {
    if (this.socket) {
      this.socket.on("userJoined", callback);
    }
  }

  onUserLeft(callback: (data: { room: Room; userId: string }) => void) {
    if (this.socket) {
      this.socket.on("userLeft", callback);
    }
  }

  onGameStarted(callback: (room: Room) => void) {
    if (this.socket) {
      this.socket.on("gameStarted", callback);
    }
  }

  onGameEnded(callback: (room: Room) => void) {
    if (this.socket) {
      this.socket.on("gameEnded", callback);
    }
  }

  // Set up event listeners for player ready status changes
  onPlayerReadyChanged(
    callback: (data: { room: Room; userId: string; isReady: boolean }) => void,
  ) {
    if (this.socket) {
      this.socket.on("playerReadyChanged", callback);
    }
  }

  // Remove event listeners
  offRooms(callback: (rooms: Room[]) => void) {
    if (this.socket) {
      this.socket.off("rooms", callback);
    }
  }

  offRoomCreated(callback: (room: Room) => void) {
    if (this.socket) {
      this.socket.off("roomCreated", callback);
    }
  }

  offUserJoined(callback: (data: { room: Room; userId: string }) => void) {
    if (this.socket) {
      this.socket.off("userJoined", callback);
    }
  }

  offUserLeft(callback: (data: { room: Room; userId: string }) => void) {
    if (this.socket) {
      this.socket.off("userLeft", callback);
    }
  }

  offGameStarted(callback: (room: Room) => void) {
    if (this.socket) {
      this.socket.off("gameStarted", callback);
    }
  }

  offGameEnded(callback: (room: Room) => void) {
    if (this.socket) {
      this.socket.off("gameEnded", callback);
    }
  }

  // Remove event listener for player ready status changes
  offPlayerReadyChanged(
    callback: (data: { room: Room; userId: string; isReady: boolean }) => void,
  ) {
    if (this.socket) {
      this.socket.off("playerReadyChanged", callback);
    }
  }
}

export const socketService = new SocketService();
