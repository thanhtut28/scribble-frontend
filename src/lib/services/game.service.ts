import { io, Socket } from "socket.io-client";
import Cookies from "js-cookie";

// Types from the backend
export interface GameState {
  id: string;
  roomId: string;
  currentRoundNum: number;
  status: "WAITING" | "PLAYING" | "FINISHED";
  startedAt: string;
  endedAt?: string;
  rounds: RoundState[];
  scores: GameScore[];
  messages: Message[];
  preserveDrawing?: boolean; // Flag to prevent clearing drawing on updates
}

export interface RoundState {
  id: string;
  gameId: string;
  roundNumber: number;
  word: string;
  drawerId?: string;
  status: "WAITING" | "DRAWING" | "GUESSING" | "FINISHED";
  startedAt: string;
  endedAt?: string;
  drawings?: Drawing[];
}

export interface Drawing {
  id: string;
  roundId: string;
  userId: string;
  paths: DrawingPath[];
  createdAt: string;
}

export interface DrawingPoint {
  x: number;
  y: number;
}

export interface DrawingPath {
  drawMode: boolean;
  strokeColor: string;
  strokeWidth: number;
  points: DrawingPoint[];
}

export interface GameScore {
  id: string;
  gameId: string;
  userId: string;
  score: number;
  correct: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    username: string;
  };
}

export interface Message {
  id: string;
  gameId: string;
  userId: string;
  content: string;
  isCorrect: boolean;
  createdAt: string;
  username: string;
}

export interface CorrectGuess {
  userId: string;
  username: string;
  word: string;
}

// Timer update interface
export interface TimerUpdate {
  gameId: string;
  roundId: string;
  remainingTime: number;
  totalTime: number;
}

// Error types for handling socket errors
export interface GameSocketError {
  code?: string;
  message: string;
  redirectTo?: string;
}

class GameService {
  private socket: Socket | null = null;
  private socketUrl =
    process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private authErrorHandlers: ((error: GameSocketError) => void)[] = [];

  // Initialize socket connection
  connect(): Promise<Socket> {
    return new Promise((resolve, reject) => {
      const token = Cookies.get("accessToken");

      if (!token) {
        reject(new Error("No authentication token found"));
        return;
      }

      console.log(
        "Attempting to connect to game service with token:",
        token.substring(0, 10) + "...",
      );
      console.log("Socket URL:", `${this.socketUrl}/game`);

      this.socket = io(`${this.socketUrl}/game`, {
        transports: ["websocket"],
        auth: { token },
        timeout: 20000,
        reconnection: false,
      });

      // Add a manual timeout to the connection attempt
      const connectionTimeout = setTimeout(() => {
        if (this.socket && !this.socket.connected) {
          console.error("Game socket connection timeout after 20 seconds");
          this.socket.close();
          reject(new Error("Connection timeout"));
        }
      }, 20000);

      this.socket.on("connect", () => {
        console.log("Game socket connected successfully");
        clearTimeout(connectionTimeout);
        this.reconnectAttempts = 0;
        resolve(this.socket!);
      });

      this.socket.on("connect_error", (error) => {
        console.error("Game socket connection error:", error);
        clearTimeout(connectionTimeout);
        reject(error);
      });

      this.socket.on("error", (error: GameSocketError) => {
        console.error("Game socket error:", error);
        this.handleSocketError(error);
      });

      this.socket.on("disconnect", (reason) => {
        console.log("Game socket disconnected:", reason);
      });

      this.socket.on("connected", (data) => {
        console.log("Game connection acknowledged:", data);
      });
    });
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

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
  onAuthError(handler: (error: GameSocketError) => void) {
    this.authErrorHandlers.push(handler);
    return () => {
      this.authErrorHandlers = this.authErrorHandlers.filter(
        (h) => h !== handler,
      );
    };
  }

  // Handle socket errors, especially authentication errors
  private handleSocketError(error: GameSocketError) {
    if (error.code === "TOKEN_EXPIRED" || error.code === "AUTH_FAILED") {
      console.error(`Authentication error: ${error.message}`);
      this.authErrorHandlers.forEach((handler) => handler(error));
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
      `Attempting to reconnect to game service (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`,
    );

    return this.connect();
  }

  // Start a new game in the specified room
  startGame(roomId: string): Promise<GameState> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected()) {
        reject(new Error("Socket not connected"));
        return;
      }

      try {
        this.socket.emit(
          "startGame",
          { roomId },
          (response: {
            error?: string;
            data?: GameState;
            redirectTo?: string;
            gameId?: string; // Added for when a game is already in progress
          }) => {
            console.log("Start game response:", response);

            try {
              // Handle null or undefined response
              if (!response) {
                console.error("Null response received from server");
                reject(
                  new Error("Invalid response from server: null response"),
                );
                return;
              }

              // Handle case where backend returns error that game is already in progress
              if (
                response.error &&
                response.error.includes("already in progress")
              ) {
                console.log("Game already in progress error detected");

                // If gameId is provided
                if (response.gameId) {
                  console.log(
                    `Game already in progress, fetching existing game state with id: ${response.gameId}`,
                  );
                  // Try to get the existing game state
                  this.getGameState(response.gameId)
                    .then((gameState) => {
                      console.log("Retrieved existing game state:", gameState);
                      resolve(gameState);
                    })
                    .catch((err) => {
                      console.error("Failed to get existing game state:", err);
                      reject(
                        new Error(
                          `${response.error} (Failed to fetch existing game)`,
                        ),
                      );
                    });
                  return;
                } else {
                  // If no gameId provided, try to handle the case differently
                  console.error("Game in progress but no gameId provided");
                  reject(new Error(`${response.error} (No game ID provided)`));
                  return;
                }
              }

              if (response.error) {
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

              if (!response.data) {
                console.error("Invalid game state response:", response);
                reject(
                  new Error("Failed to start game: Invalid response format"),
                );
                return;
              }

              // Validate the game state
              if (!response.data.id || !response.data.roomId) {
                console.error("Invalid game state data:", response.data);
                reject(
                  new Error("Invalid game state data returned from server"),
                );
                return;
              }

              // Initialize arrays if they're missing to prevent errors later
              const gameState = response.data;
              if (!Array.isArray(gameState.rounds)) gameState.rounds = [];
              if (!Array.isArray(gameState.scores)) gameState.scores = [];
              if (!Array.isArray(gameState.messages)) gameState.messages = [];

              resolve(gameState);
            } catch (callbackError: unknown) {
              const errorMessage =
                callbackError instanceof Error
                  ? callbackError.message
                  : "Unknown error";
              console.error(
                "Error processing startGame response:",
                callbackError,
              );
              reject(
                new Error(`Error processing server response: ${errorMessage}`),
              );
            }
          },
        );
      } catch (emitError: unknown) {
        const errorMessage =
          emitError instanceof Error ? emitError.message : "Unknown error";
        console.error("Error emitting startGame event:", emitError);
        reject(new Error(`Socket emit error: ${errorMessage}`));
      }
    });
  }

  // Start the next round
  startRound(gameId: string): Promise<GameState> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected()) {
        reject(new Error("Socket not connected"));
        return;
      }

      this.socket.emit(
        "startRound",
        gameId,
        (response: {
          error?: string;
          data?: GameState;
          redirectTo?: string;
        }) => {
          if (response.error) {
            if (response.redirectTo) {
              this.handleSocketError({
                code: "AUTH_FAILED",
                message: response.error,
                redirectTo: response.redirectTo,
              });
            }
            reject(new Error(response.error));
          } else if (!response.data) {
            reject(new Error("Failed to start round: Invalid response format"));
          } else {
            resolve(response.data);
          }
        },
      );
    });
  }

  // End the current round
  endRound(gameId: string): Promise<GameState> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected()) {
        reject(new Error("Socket not connected"));
        return;
      }

      this.socket.emit(
        "endRound",
        gameId,
        (response: {
          error?: string;
          data?: GameState;
          redirectTo?: string;
        }) => {
          if (response.error) {
            if (response.redirectTo) {
              this.handleSocketError({
                code: "AUTH_FAILED",
                message: response.error,
                redirectTo: response.redirectTo,
              });
            }
            reject(new Error(response.error));
          } else if (!response.data) {
            reject(new Error("Failed to end round: Invalid response format"));
          } else {
            resolve(response.data);
          }
        },
      );
    });
  }

  // Make a guess
  makeGuess(
    gameId: string,
    guess: string,
  ): Promise<{ isCorrect: boolean; message: Message }> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected()) {
        reject(new Error("Socket not connected"));
        return;
      }

      this.socket.emit(
        "guess",
        { gameId, guess },
        (response: {
          error?: string;
          isCorrect?: boolean;
          message?: Message;
          redirectTo?: string;
        }) => {
          if (response.error) {
            if (response.redirectTo) {
              this.handleSocketError({
                code: "AUTH_FAILED",
                message: response.error,
                redirectTo: response.redirectTo,
              });
            }
            reject(new Error(response.error));
          } else if (response.isCorrect === undefined || !response.message) {
            reject(new Error("Failed to make guess: Invalid response format"));
          } else {
            resolve({
              isCorrect: response.isCorrect,
              message: response.message,
            });
          }
        },
      );
    });
  }

  // Send a chat message (which will also check if it's a correct guess)
  sendMessage(
    gameId: string,
    content: string,
  ): Promise<{ isCorrect: boolean; message: Message }> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected()) {
        reject(new Error("Socket not connected"));
        return;
      }

      this.socket.emit(
        "sendMessage",
        { gameId, content },
        (response: {
          error?: string;
          isCorrect?: boolean;
          message?: Message;
          redirectTo?: string;
        }) => {
          if (response.error) {
            if (response.redirectTo) {
              this.handleSocketError({
                code: "AUTH_FAILED",
                message: response.error,
                redirectTo: response.redirectTo,
              });
            }
            reject(new Error(response.error));
          } else if (response.isCorrect === undefined || !response.message) {
            reject(
              new Error("Failed to send message: Invalid response format"),
            );
          } else {
            resolve({
              isCorrect: response.isCorrect,
              message: response.message,
            });
          }
        },
      );
    });
  }

  // Update the drawing
  updateDrawing(
    gameId: string,
    roundId: string,
    paths: DrawingPath[],
  ): Promise<{ success: boolean }> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected()) {
        reject(new Error("Socket not connected"));
        return;
      }

      // Validate parameters
      if (!gameId || !roundId || !Array.isArray(paths)) {
        reject(new Error("Invalid parameters for updateDrawing"));
        return;
      }

      this.socket.emit(
        "updateDrawing",
        { gameId, roundId, paths },
        (response: {
          error?: string;
          success?: boolean;
          redirectTo?: string;
        }) => {
          if (response.error) {
            console.error("Drawing update error:", response.error);

            if (response.redirectTo) {
              this.handleSocketError({
                code: "AUTH_FAILED",
                message: response.error,
                redirectTo: response.redirectTo,
              });
            }
            reject(new Error(response.error));
          } else if (response.success === undefined) {
            reject(
              new Error("Failed to update drawing: Invalid response format"),
            );
          } else {
            resolve({ success: response.success });
          }
        },
      );
    });
  }

  // Get the current game state
  getGameState(gameId: string): Promise<GameState> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected()) {
        reject(new Error("Socket not connected"));
        return;
      }

      try {
        this.socket.emit(
          "getGameState",
          gameId,
          (response: {
            error?: string;
            data?: GameState;
            redirectTo?: string;
          }) => {
            try {
              // Handle null or undefined response
              if (!response) {
                console.error("Null response received from server");
                reject(
                  new Error("Invalid response from server: null response"),
                );
                return;
              }

              if (response.error) {
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

              if (!response.data) {
                console.error("Invalid game state response:", response);
                reject(
                  new Error(
                    "Failed to get game state: Invalid response format",
                  ),
                );
                return;
              }

              // Ensure we have a valid game state with all required properties
              const gameState = response.data;
              if (!gameState.id || !gameState.roomId) {
                console.error("Invalid game state data:", gameState);
                reject(
                  new Error("Invalid game state data returned from server"),
                );
                return;
              }

              // Initialize arrays if they're missing to prevent errors later
              if (!Array.isArray(gameState.rounds)) gameState.rounds = [];
              if (!Array.isArray(gameState.scores)) gameState.scores = [];
              if (!Array.isArray(gameState.messages)) gameState.messages = [];

              resolve(gameState);
            } catch (callbackError: unknown) {
              const errorMessage =
                callbackError instanceof Error
                  ? callbackError.message
                  : "Unknown error";
              console.error(
                "Error processing getGameState response:",
                callbackError,
              );
              reject(
                new Error(`Error processing server response: ${errorMessage}`),
              );
            }
          },
        );
      } catch (emitError: unknown) {
        const errorMessage =
          emitError instanceof Error ? emitError.message : "Unknown error";
        console.error("Error emitting getGameState event:", emitError);
        reject(new Error(`Socket emit error: ${errorMessage}`));
      }
    });
  }

  // Event listeners for game events
  onGameStarted(callback: (game: GameState) => void) {
    if (this.socket) {
      this.socket.on("gameStarted", callback);
    }
  }

  onRoundStarted(
    callback: (data: {
      gameId: string;
      roundNumber: number;
      round: RoundState;
    }) => void,
  ) {
    if (this.socket) {
      this.socket.on("roundStarted", callback);
    }
  }

  onRoundEnded(
    callback: (data: {
      gameId: string;
      roundNumber: number;
      nextRound?: RoundState;
    }) => void,
  ) {
    if (this.socket) {
      this.socket.on("roundEnded", callback);
    }
  }

  onGameEnded(callback: (game: GameState) => void) {
    if (this.socket) {
      this.socket.on("gameEnded", callback);
    }
  }

  onMessage(callback: (message: Message) => void) {
    if (this.socket) {
      this.socket.on("message", callback);
    }
  }

  onCorrectGuess(callback: (guess: CorrectGuess) => void) {
    if (this.socket) {
      this.socket.on("correctGuess", callback);
    }
  }

  onScoresUpdated(callback: (scores: GameScore[]) => void) {
    if (this.socket) {
      this.socket.on("scoresUpdated", callback);
    }
  }

  onDrawingUpdated(
    callback: (data: {
      gameId: string;
      roundId: string;
      paths: DrawingPath[];
    }) => void,
  ) {
    if (this.socket) {
      this.socket.on("drawingUpdated", callback);
    }
  }

  // Remove event listeners
  offGameStarted(callback: (game: GameState) => void) {
    if (this.socket) {
      this.socket.off("gameStarted", callback);
    }
  }

  offRoundStarted(
    callback: (data: {
      gameId: string;
      roundNumber: number;
      round: RoundState;
    }) => void,
  ) {
    if (this.socket) {
      this.socket.off("roundStarted", callback);
    }
  }

  offRoundEnded(
    callback: (data: {
      gameId: string;
      roundNumber: number;
      nextRound?: RoundState;
    }) => void,
  ) {
    if (this.socket) {
      this.socket.off("roundEnded", callback);
    }
  }

  offGameEnded(callback: (game: GameState) => void) {
    if (this.socket) {
      this.socket.off("gameEnded", callback);
    }
  }

  offMessage(callback: (message: Message) => void) {
    if (this.socket) {
      this.socket.off("message", callback);
    }
  }

  offCorrectGuess(callback: (guess: CorrectGuess) => void) {
    if (this.socket) {
      this.socket.off("correctGuess", callback);
    }
  }

  offScoresUpdated(callback: (scores: GameScore[]) => void) {
    if (this.socket) {
      this.socket.off("scoresUpdated", callback);
    }
  }

  offDrawingUpdated(
    callback: (data: {
      gameId: string;
      roundId: string;
      paths: DrawingPath[];
    }) => void,
  ) {
    if (this.socket) {
      this.socket.off("drawingUpdated", callback);
    }
  }

  // Timer update event listeners
  onTimerUpdate(callback: (timerData: TimerUpdate) => void) {
    if (this.socket) {
      this.socket.on("timerUpdate", callback);
    }
  }

  offTimerUpdate(callback: (timerData: TimerUpdate) => void) {
    if (this.socket) {
      this.socket.off("timerUpdate", callback);
    }
  }

  // Get round duration
  getRoundDuration(): number {
    return 60; // Default 60 seconds, server will override this
  }

  // Request the current timer state from the server
  async requestTimerState(
    gameId: string,
    roundId: string,
  ): Promise<TimerUpdate> {
    try {
      // Convert milliseconds to seconds according to the server format
      return new Promise<TimerUpdate>((resolve, reject) => {
        this.socket?.emit(
          "requestTimerState",
          { gameId, roundId },
          (response: { error?: string; data?: TimerUpdate }) => {
            if (response.error) {
              reject(new Error(response.error));
            } else {
              resolve(response.data as TimerUpdate);
            }
          },
        );
      });
    } catch (error) {
      console.error("Failed to request timer state:", error);
      // Provide a fallback timer update with default values
      return {
        gameId,
        roundId,
        remainingTime: 0, // Use 0 to indicate unknown time instead of null
        totalTime: 60, // Default to 60 seconds
      };
    }
  }
}

export const gameService = new GameService();
