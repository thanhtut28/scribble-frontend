"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import {
  gameService,
  GameState,
  RoundState,
  DrawingPath,
  Message,
  GameScore,
  GameSocketError,
  TimerUpdate,
} from "../services/game.service";
import { Socket } from "socket.io-client";
import { useAuth } from "./auth-provider";
import { Room } from "../services/socket.service";
import { toast } from "sonner";
import { useSocket } from "./socket-provider";

interface GameContextType {
  gameSocket: Socket | null;
  isConnected: boolean;
  connecting: boolean;
  error: Error | null;
  gameState: GameState | null;
  currentRound: RoundState | null;
  currentWord: string | null;
  isDrawer: boolean;
  scores: GameScore[];
  messages: Message[];
  roundTimeRemaining: number | null;
  roundDuration: number;
  connect: () => Promise<void>;
  disconnect: () => void;
  startGame: (roomId: string) => Promise<GameState>;
  startRound: (gameId: string) => Promise<GameState>;
  endRound: (gameId: string) => Promise<GameState>;
  sendChatMessage: (content: string) => Promise<void>;
  updateDrawing: (paths: DrawingPath[]) => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, handleAuthError, user } = useAuth();
  const { currentRoom } = useSocket();
  const [gameSocket, setGameSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentRound, setCurrentRound] = useState<RoundState | null>(null);
  const [scores, setScores] = useState<GameScore[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [roundTimeRemaining, setRoundTimeRemaining] = useState<number | null>(
    null,
  );
  const [roundDuration, setRoundDuration] = useState<number>(60);

  // Computed properties
  const currentWord =
    currentRound?.word === "********" ? null : currentRound?.word || null;
  const isDrawer =
    !!currentRound?.drawerId && currentRound.drawerId === user?.id;

  // Handle socket auth errors
  const handleSocketAuthError = useCallback(
    (error: GameSocketError) => {
      console.error("Game socket authentication error:", error);
      handleAuthError(error);
    },
    [handleAuthError],
  );

  // Set up game socket event handlers
  const setupSocketEventHandlers = useCallback(() => {
    // Register to socket auth error events
    gameService.onAuthError(handleSocketAuthError);

    // Game events
    gameService.onGameStarted((game) => {
      console.log("Game started:", game);
      setGameState(game);

      // Find the first round
      const firstRound = game.rounds.find((r) => r.roundNumber === 1);
      if (firstRound) {
        setCurrentRound(firstRound);

        // Automatically start the first round if the game is created with rounds
        if (game.status === "PLAYING" && firstRound.status === "WAITING") {
          console.log("Auto-starting first round");
          setTimeout(() => {
            startRound(game.id).catch((err) =>
              console.error("Failed to auto-start first round:", err),
            );
          }, 1000);
        }
      }

      // Update scores
      setScores(game.scores);

      // Clear messages
      setMessages([]);

      toast.success("Game started!");
    });

    gameService.onRoundStarted((data) => {
      console.log("Round started:", data);

      // Update current round
      setCurrentRound(data.round);

      // Update game state round number
      if (gameState) {
        console.log(
          "Updating game state with new round number:",
          data.roundNumber,
        );
        setGameState({
          ...gameState,
          currentRoundNum: data.roundNumber,
        });
      } else {
        console.error("Game state is null during round start");
      }

      toast.success(`Round ${data.roundNumber} started!`);

      // If current user is the drawer, notify them
      if (data.round.drawerId === user?.id) {
        toast.success(`You are the drawer for this round!`);
      }
    });

    gameService.onRoundEnded((data) => {
      console.log("Round ended:", data);

      toast.success(`Round ${data.roundNumber} ended!`);

      // Reset round timer
      setRoundTimeRemaining(null);

      // If there's a next round, show it
      if (data.nextRound) {
        setCurrentRound(data.nextRound);

        // If we have a nextRound and it's in WAITING status, auto-start it after a short delay
        if (data.nextRound.status === "WAITING" && gameState) {
          console.log("Auto-starting next round after delay");
          setTimeout(() => {
            startRound(gameState.id).catch((err) =>
              console.error("Failed to auto-start next round:", err),
            );
          }, 3000); // Give players 3 seconds between rounds
        }
      }

      // Update game state if available
      if (gameState) {
        setGameState({
          ...gameState,
          currentRoundNum: data.roundNumber + 1,
        });
      }
    });

    gameService.onGameEnded((game) => {
      console.log("Game ended:", game);
      setGameState(game);
      setScores(game.scores);

      // Reset timer
      setRoundTimeRemaining(null);

      // The game end dialog will now be handled in the drawing-room-template component
    });

    gameService.onMessage((message) => {
      console.log("New message:", message);
      setMessages((prev) => [...prev, message]);
    });

    gameService.onCorrectGuess((guess) => {
      console.log("Correct guess:", guess);
      const isCurrentUser = guess.userId === user?.id;

      if (isCurrentUser) {
        toast.success("You guessed correctly!");
      } else {
        toast.success(`${guess.username} guessed correctly!`);
      }
    });

    gameService.onScoresUpdated((updatedScores) => {
      console.log("Scores updated:", updatedScores);
      setScores(updatedScores);
    });

    // Handle timer updates from the server
    gameService.onTimerUpdate((timerData) => {
      console.log("Timer update received:", timerData);

      // Instead of relying on stale closure variables, use the most up-to-date state
      // by using the setter with function form
      setCurrentRound((prevCurrentRound) => {
        // If we already have a matching round
        if (prevCurrentRound && prevCurrentRound.id === timerData.roundId) {
          console.log("Current round matches timer update round");

          // If round status is WAITING but should be active, update it
          if (
            prevCurrentRound.status === "WAITING" &&
            gameState?.status === "PLAYING"
          ) {
            console.log("Updating round from WAITING to DRAWING state");

            // Create updated round with DRAWING status
            const updatedRound: RoundState = {
              ...prevCurrentRound,
              status: "DRAWING", // Set to DRAWING since that's the first active state
            };

            // Update game state to ensure consistency
            setGameState((prevGameState) => {
              if (!prevGameState) return prevGameState;

              // Find and update the round in game state
              const updatedRounds = prevGameState.rounds.map((r) =>
                r.id === updatedRound.id ? updatedRound : r,
              );

              return {
                ...prevGameState,
                rounds: updatedRounds,
              };
            });

            // Return the updated round to update currentRound state
            return updatedRound;
          }

          // Return unchanged if no updates needed
          return prevCurrentRound;
        }
        // If currentRound is null or doesn't match timer round ID
        else {
          // Try to find the round in gameState
          const matchingRound = gameState?.rounds.find(
            (r) => r.id === timerData.roundId,
          );

          if (matchingRound) {
            console.log(
              "Found matching round in game state, updating current round:",
              matchingRound,
            );
            return matchingRound;
          }

          // If no matching round found, keep the current round
          return prevCurrentRound;
        }
      });

      // Always update the timer information regardless of round state
      console.log("Updating round duration and time remaining");
      if (timerData.totalTime !== roundDuration) {
        setRoundDuration(timerData.totalTime);
      }

      // Set time remaining regardless of round match to ensure timer always updates
      // Ensure it's never null
      if (
        timerData.remainingTime !== null &&
        timerData.remainingTime !== undefined
      ) {
        setRoundTimeRemaining(timerData.remainingTime);
      } else {
        // If server sends null, default to full round duration in milliseconds
        setRoundTimeRemaining(roundDuration * 1000);
      }
    });

    gameService.onDrawingUpdated((drawingData) => {
      console.log("Drawing updated received from server:", drawingData);

      // First update the currentRound with the new drawing
      setCurrentRound((prevRound) => {
        if (!prevRound) {
          console.error("Cannot update drawing: current round is null");
          return prevRound;
        }

        // Make sure the round ID matches
        if (prevRound.id !== drawingData.roundId) {
          console.error(
            `Round ID mismatch: current=${prevRound.id}, update=${drawingData.roundId}`,
          );
          return prevRound;
        }

        console.log(
          "Updating current round with new drawing paths:",
          drawingData.paths.length,
        );

        // Find if we already have a drawing for this round
        const drawings = prevRound.drawings || [];
        const existingDrawingIndex = drawings.findIndex(
          (drawing) => drawing.roundId === drawingData.roundId,
        );

        // Create a new drawings array
        const updatedDrawings = [...drawings];

        if (existingDrawingIndex !== undefined && existingDrawingIndex >= 0) {
          // Update existing drawing
          updatedDrawings[existingDrawingIndex] = {
            ...updatedDrawings[existingDrawingIndex],
            paths: drawingData.paths,
          };
        } else {
          // Add as a new drawing with required Drawing properties
          updatedDrawings.push({
            id: drawingData.roundId, // Using roundId as a temporary id
            userId: "", // This will be filled by the server later
            roundId: drawingData.roundId,
            paths: drawingData.paths,
            createdAt: new Date().toISOString(),
          });
        }

        // Return updated round with new drawings
        return {
          ...prevRound,
          drawings: updatedDrawings,
        };
      });

      // Also update the game state to ensure consistency
      setGameState((prevGameState) => {
        if (!prevGameState) {
          console.error("Cannot update game state: game state is null");
          return prevGameState;
        }

        // Find the current round in the game state
        const rounds = prevGameState.rounds || [];
        const roundIndex = rounds.findIndex(
          (r) => r.id === drawingData.roundId,
        );

        if (roundIndex === -1) {
          console.error(
            `Round not found in game state: ${drawingData.roundId}`,
          );
          return prevGameState;
        }

        // Make a copy of the rounds array
        const updatedRounds = [...rounds];
        const round = updatedRounds[roundIndex];

        // Initialize or update the drawings array
        const drawings = round.drawings || [];
        const existingDrawingIndex = drawings.findIndex(
          (drawing) => drawing.roundId === drawingData.roundId,
        );

        let updatedDrawings;
        if (existingDrawingIndex !== -1) {
          // Update existing drawing
          updatedDrawings = [...drawings];
          updatedDrawings[existingDrawingIndex] = {
            ...updatedDrawings[existingDrawingIndex],
            paths: drawingData.paths,
          };
        } else {
          // Add new drawing
          updatedDrawings = [
            ...drawings,
            {
              id: drawingData.roundId,
              userId: "",
              roundId: drawingData.roundId,
              paths: drawingData.paths,
              createdAt: new Date().toISOString(),
            },
          ];
        }

        // Update the round with new drawings
        updatedRounds[roundIndex] = {
          ...round,
          drawings: updatedDrawings,
        };

        // Return updated game state
        return {
          ...prevGameState,
          rounds: updatedRounds,
        };
      });
    });
  }, [gameState, handleSocketAuthError, user?.id, roundDuration, currentRound]);

  // Connect to socket
  const connect = useCallback(async (): Promise<void> => {
    if (!isAuthenticated) {
      console.log(
        "Not attempting game socket connection - user is not authenticated",
      );
      return;
    }

    if (connecting) {
      console.log("Already attempting to connect game socket, skipping");
      return;
    }

    console.log("Starting game socket connection attempt...");
    setConnecting(true);
    setError(null);

    try {
      // Clear previous state on new connection attempt
      setGameState(null);
      setCurrentRound(null);
      setScores([]);
      setMessages([]);

      // Attempt to connect
      const socket = await gameService.connect();
      console.log("Game socket connection successful");
      setGameSocket(socket);
      setIsConnected(true);

      // Always set up event handlers after successful connection
      setupSocketEventHandlers();

      // If we're in a room with a game in progress, try to get the game state
      if (currentRoom?.id) {
        try {
          console.log(`Getting game state for room: ${currentRoom.id}`);
          const game = await gameService.getGameState(currentRoom.id);

          // Validate game data
          if (!game) {
            console.error("No game data returned");
            throw new Error("No game data returned from server");
          }

          // Validate key properties
          if (!game.id || !game.roomId) {
            console.error("Invalid game data returned:", game);
            throw new Error("Invalid game data: missing required properties");
          }

          console.log("Setting game state from current room:", game);
          setGameState(game);

          // Find the current round
          if (typeof game.currentRoundNum === "number") {
            const round = game.rounds.find(
              (r) => r.roundNumber === game.currentRoundNum,
            );
            if (round) {
              console.log("Setting current round:", round);
              setCurrentRound(round);
            } else {
              console.log(
                "No matching round found for round number:",
                game.currentRoundNum,
              );
            }
          } else {
            console.log("Game has no valid currentRoundNum");
          }

          // Set scores and messages with defensive checks
          if (Array.isArray(game.scores)) {
            setScores(game.scores);
          } else {
            console.log("Game has no scores array, initializing empty array");
            setScores([]);
          }

          if (Array.isArray(game.messages)) {
            setMessages(game.messages);
          } else {
            console.log("Game has no messages array, initializing empty array");
            setMessages([]);
          }
        } catch (err) {
          console.error("Failed to get game state:", err);
          // Don't rethrow - we can still function without the game state
          // We'll just start fresh
        }
      }
    } catch (err) {
      console.error("Game socket connection error:", err);
      setError(err instanceof Error ? err : new Error("Failed to connect"));
      setIsConnected(false);
      setGameSocket(null);

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
    currentRoom,
    handleAuthError,
    setupSocketEventHandlers,
  ]);

  const disconnect = useCallback(() => {
    // Clean up socket event handlers
    gameService.disconnect();
    setGameSocket(null);
    setIsConnected(false);
    setGameState(null);
    setCurrentRound(null);
    setScores([]);
    setMessages([]);
  }, []);

  // Game actions
  const startGame = async (roomId: string): Promise<GameState> => {
    try {
      console.log("Starting game in room:", roomId);

      // If a game is already active, clear it to prevent state conflicts
      if (gameState) {
        console.log("Clearing existing game state before starting new game");
        setGameState(null);
        setCurrentRound(null);
        setScores([]);
        setMessages([]);
      }

      console.log("Calling gameService.startGame");
      const game = await gameService.startGame(roomId);
      console.log("Game started or existing game retrieved:", game);

      // Implement defensive checks
      if (!game) {
        console.error("No game data returned");
        throw new Error("No game data returned from server");
      }

      // Validate key properties
      if (!game.id || !game.roomId) {
        console.error("Invalid game data returned:", game);
        throw new Error("Invalid game data: missing required properties");
      }

      // Update local state with the game data
      console.log("Setting game state in provider");
      setGameState(game);

      // Find the current round
      const currentRoundNum = game.currentRoundNum || 1;
      console.log(`Looking for round ${currentRoundNum}`);

      // Ensure rounds array exists
      if (!Array.isArray(game.rounds)) {
        console.log("Game has no rounds array, initializing empty array");
        game.rounds = [];
      } else {
        console.log(`Game has ${game.rounds.length} rounds`);
      }

      const currentRound = game.rounds.find(
        (r) => r.roundNumber === currentRoundNum,
      );

      if (currentRound) {
        console.log("Found current round:", currentRound.id);
        setCurrentRound(currentRound);
      } else {
        console.log("No current round found");
        setCurrentRound(null);
      }

      // Set initial scores
      if (Array.isArray(game.scores)) {
        console.log(`Setting ${game.scores.length} scores`);
        setScores(game.scores);
      } else {
        console.log("No scores in game data, initializing empty array");
        setScores([]);
      }

      // Set initial messages
      if (Array.isArray(game.messages)) {
        console.log(`Setting ${game.messages.length} messages`);
        setMessages(game.messages);
      } else {
        console.log("No messages in game data, initializing empty array");
        setMessages([]);
      }

      console.log("Game state successfully set");
      return game;
    } catch (err) {
      console.error("Failed to start game:", err);

      // Check if this is an auth error
      if (
        err instanceof Error &&
        (err.message.includes("authentication") ||
          err.message.includes("token") ||
          err.message.includes("expired"))
      ) {
        handleAuthError({
          code: "AUTH_FAILED",
          message: err instanceof Error ? err.message : "Authentication failed",
          redirectTo: "/login",
        });
      }

      toast.error(err instanceof Error ? err.message : "Failed to start game");
      throw err;
    }
  };

  const startRound = async (gameId: string): Promise<GameState> => {
    try {
      console.log("Starting round in game:", gameId);
      const game = await gameService.startRound(gameId);
      console.log("Round started, game state:", game);

      setGameState(game);

      // Find current round
      const currentRound = game.rounds.find(
        (r) => r.roundNumber === game.currentRoundNum,
      );
      if (currentRound) {
        setCurrentRound(currentRound);
      }

      return game;
    } catch (err) {
      console.error("Failed to start round:", err);

      // Check if this is an auth error
      if (
        err instanceof Error &&
        (err.message.includes("authentication") ||
          err.message.includes("token") ||
          err.message.includes("expired"))
      ) {
        handleAuthError({
          code: "AUTH_FAILED",
          message: err instanceof Error ? err.message : "Authentication failed",
          redirectTo: "/login",
        });
      }

      toast.error(err instanceof Error ? err.message : "Failed to start round");
      throw err;
    }
  };

  // Add canvas clearing function
  const clearCanvas = () => {
    // This function doesn't directly manipulate the canvas - that will be handled
    // by the DrawingBoard component which watches for round changes
    console.log("Canvas will be cleared on round change");

    // But we do need to update the server that the drawing is cleared
    if (gameState && currentRound) {
      try {
        gameService.updateDrawing(gameState.id, currentRound.id, []);
      } catch (err) {
        console.error("Failed to clear canvas on server:", err);
      }
    }
  };

  const endRound = async (gameId: string): Promise<GameState> => {
    try {
      console.log("Ending round in game:", gameId);

      // Clear the canvas first to ensure it's clean for the next round
      clearCanvas();

      const game = await gameService.endRound(gameId);
      console.log("Round ended, game state:", game);

      // Make sure we always have valid game state
      setGameState(game);

      // Find next round if game is still in progress
      if (game.status === "PLAYING") {
        const nextRound = game.rounds.find(
          (r) => r.roundNumber === game.currentRoundNum,
        );

        if (nextRound) {
          console.log("Next round found:", nextRound.id);
          setCurrentRound(nextRound);

          // Auto-start the next round after a delay
          if (nextRound.status === "WAITING") {
            console.log("Auto-starting next round after delay");
            setTimeout(() => {
              startRound(game.id).catch((err) =>
                console.error("Failed to auto-start next round:", err),
              );
            }, 3000); // Give players 3 seconds between rounds
          }
        } else {
          console.warn("No next round found, but game is still PLAYING");
        }
      } else {
        // Game ended
        console.log("Game has ended");
      }

      return game;
    } catch (err) {
      console.error("Failed to end round:", err);

      // Check if this is an auth error
      if (
        err instanceof Error &&
        (err.message.includes("authentication") ||
          err.message.includes("token") ||
          err.message.includes("expired"))
      ) {
        handleAuthError({
          code: "AUTH_FAILED",
          message: err instanceof Error ? err.message : "Authentication failed",
          redirectTo: "/login",
        });
      }

      toast.error(err instanceof Error ? err.message : "Failed to end round");
      throw err;
    }
  };

  const sendChatMessage = async (content: string): Promise<void> => {
    if (!gameState) {
      toast.error("No active game");
      return;
    }

    try {
      console.log("Sending chat message:", content);
      await gameService.sendMessage(gameState.id, content);
      // The message will be added to the state through the onMessage event handler
    } catch (err) {
      console.error("Failed to send message:", err);

      // Check if this is an auth error
      if (
        err instanceof Error &&
        (err.message.includes("authentication") ||
          err.message.includes("token") ||
          err.message.includes("expired"))
      ) {
        handleAuthError({
          code: "AUTH_FAILED",
          message: err instanceof Error ? err.message : "Authentication failed",
          redirectTo: "/login",
        });
      }

      toast.error(
        err instanceof Error ? err.message : "Failed to send message",
      );
    }
  };

  const updateDrawing = async (paths: DrawingPath[]): Promise<void> => {
    if (!gameState || !currentRound) {
      console.error("No active game or round");
      return;
    }

    // Only the drawer can update the drawing
    if (!isDrawer) {
      console.error("Only the drawer can update the drawing");
      return;
    }

    // Ensure game is in progress
    if (gameState.status !== "PLAYING") {
      console.error("The game is not in progress");
      return;
    }

    // Check if round is in proper state for drawing
    // If the round is WAITING but the game is PLAYING and we're the drawer,
    // we'll allow drawing since it's likely a state transition issue
    const isInTransition =
      currentRound.status === "WAITING" && gameState.status === "PLAYING";
    if (
      currentRound.status !== "DRAWING" &&
      currentRound.status !== "GUESSING" &&
      !isInTransition
    ) {
      console.error("Round is not in drawing or guessing state");
      return;
    }

    try {
      console.log("Updating drawing:", paths);

      // If we're in a transition state, try to update the round status first
      if (isInTransition) {
        console.log(
          "Detected round state transition, attempting to start round first",
        );
        try {
          // Try to start the round if we're in a transition state
          await startRound(gameState.id);
        } catch (err) {
          console.warn(
            "Failed to auto-start round during drawing update:",
            err,
          );
          // Continue anyway since the drawing update might still succeed
        }
      }

      // Set a flag to preserve the drawing across game state updates
      setGameState((prevState) => {
        if (!prevState) return prevState;
        return {
          ...prevState,
          preserveDrawing: true,
        };
      });

      await gameService.updateDrawing(gameState.id, currentRound.id, paths);
    } catch (err) {
      console.error("Failed to update drawing:", err);

      // Check if this is an auth error
      if (
        err instanceof Error &&
        (err.message.includes("authentication") ||
          err.message.includes("token") ||
          err.message.includes("expired"))
      ) {
        handleAuthError({
          code: "AUTH_FAILED",
          message: err instanceof Error ? err.message : "Authentication failed",
          redirectTo: "/login",
        });
      }
    }
  };

  // Connect when authenticated
  useEffect(() => {
    if (isAuthenticated && !isConnected && !connecting) {
      connect();
    }
  }, [isAuthenticated, isConnected, connecting, connect]);

  // Disconnect when not authenticated
  useEffect(() => {
    if (!isAuthenticated && isConnected) {
      disconnect();
    }
  }, [isAuthenticated, isConnected, disconnect]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return (
    <GameContext.Provider
      value={{
        gameSocket,
        isConnected,
        connecting,
        error,
        gameState,
        currentRound,
        currentWord,
        isDrawer,
        scores,
        messages,
        roundTimeRemaining,
        roundDuration,
        connect,
        disconnect,
        startGame,
        startRound,
        endRound,
        sendChatMessage,
        updateDrawing,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
};
