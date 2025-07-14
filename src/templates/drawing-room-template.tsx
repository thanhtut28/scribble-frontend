"use client";

import ChatRoom from "@/components/chat-room/chat-room";
import RoomUsers, { RoomUser } from "@/components/chat-room/room-users";
import DrawingBoard from "@/components/drawing-board/drawing-board";
import { Room } from "@/lib/services/socket.service";
import { useEffect, useRef, useState, useCallback } from "react";
import { useGame } from "@/lib/providers/game-provider";
import { useAuth } from "@/lib/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  RoundState,
  gameService,
  GameState,
  GameScore,
} from "@/lib/services/game.service";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  PlayCircle,
  SkipForward,
  Trophy,
  Medal,
  Award,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSocket } from "@/lib/providers/socket-provider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

interface DrawingRoomTemplateProps {
  room: Room;
}

export default function DrawingRoomTemplate({
  room,
}: DrawingRoomTemplateProps) {
  const { user } = useAuth();
  const { toggleReady, leaveRoom } = useSocket();
  const {
    gameState,
    currentRound,
    isDrawer,
    currentWord,
    scores,
    startGame,
    startRound,
    endRound,
    messages: gameMessages,
    roundTimeRemaining,
    roundDuration,
  } = useGame();

  const [timeLeft, setTimeLeft] = useState(roundDuration);
  const [showTurnNotification, setShowTurnNotification] = useState(false);
  const [currentDrawerName, setCurrentDrawerName] = useState("");
  const [loading, setLoading] = useState(false);
  const turnChangeAudio = useRef<HTMLAudioElement | null>(null);
  const correctGuessTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timerRequestIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [showGameEndDialog, setShowGameEndDialog] = useState(false);
  const [gameWinners, setGameWinners] = useState<GameScore[]>([]);
  const router = useRouter();

  // Convert socket room users to our component's format
  const [users, setUsers] = useState<RoomUser[]>([]);

  // Check if user is room owner
  const isRoomOwner = user?.id === room.ownerId;

  // Check if current user is ready
  const isCurrentUserReady =
    room.users.find((u) => u.userId === user?.id)?.isReady || false;

  // Check if all players are ready
  const areAllPlayersReady = room.users.every((u) => u.isReady);

  // Request timer state when needed as a fallback
  const requestTimerState = useCallback(async () => {
    if (!gameState || !currentRound || !gameState.id || !currentRound.id) {
      return;
    }

    // Only request for active rounds or for rounds that should be active
    // Include WAITING state to handle transition periods
    if (
      currentRound.status !== "DRAWING" &&
      currentRound.status !== "GUESSING" &&
      currentRound.status !== "WAITING" &&
      gameState.status === "PLAYING"
    ) {
      return;
    }

    try {
      const timerState = await gameService.requestTimerState(
        gameState.id,
        currentRound.id,
      );
      console.log("Requested timer state:", timerState);

      // If the server timer update is significantly different from our local time or we haven't received updates
      if (
        roundTimeRemaining === null ||
        timerState.remainingTime === null ||
        Math.abs(timeLeft - Math.ceil((timerState.remainingTime || 0) / 1000)) >
          3
      ) {
        console.log(
          "Setting timeLeft from manual timer request:",
          timerState.remainingTime,
        );
        // Ensure we handle null timeRemaining by defaulting to roundDuration
        setTimeLeft(
          timerState.remainingTime
            ? Math.ceil(timerState.remainingTime / 1000)
            : roundDuration,
        );
      }

      // If the round state is WAITING but we're getting timer updates,
      // the round should have started - notify the user
      if (currentRound.status === "WAITING" && gameState.status === "PLAYING") {
        console.log(
          "Round state appears out of sync with timer. Round should be active.",
        );

        // Only the drawer or room owner should try to fix this to avoid multiple calls
        if (isDrawer || isRoomOwner) {
          console.log("Attempting to start round to fix synchronization");
          startRound(gameState.id).catch((err) =>
            console.error("Failed to auto-start round during timer sync:", err),
          );
        }
      }
    } catch (error) {
      console.error("Failed to request timer state:", error);
    }
  }, [
    gameState,
    currentRound,
    timeLeft,
    roundTimeRemaining,
    isDrawer,
    isRoomOwner,
    startRound,
    roundDuration,
  ]);

  // Update users when room changes
  useEffect(() => {
    if (room && room.users) {
      const mappedUsers = room.users.map((user, index) => ({
        id: user.userId,
        name: user.user.username,
        avatar: "/placeholder.svg?height=40&width=40",
        points: 0, // We'll update with scores later
        joinOrder: index,
        joinedAt: new Date(user.joinedAt),
        isCurrentUser: user.userId === user?.id,
        isReady: user.isReady,
      }));

      setUsers(mappedUsers);
    }
  }, [room, user?.id]);

  // Update users with scores when game scores change
  useEffect(() => {
    if (!scores || !scores.length) return;

    setUsers((prev) =>
      prev.map((user) => {
        const userScore = scores.find((score) => score.userId === user.id);
        return {
          ...user,
          points: userScore?.score || 0,
        };
      }),
    );
  }, [scores]);

  // Initialize audio on component mount
  useEffect(() => {
    turnChangeAudio.current = new Audio("/turn-change.mp3");
    // We're using a placeholder URL since we don't have an actual audio file
    // In a real app, you would use an actual sound file
  }, []);

  // Set drawer name when round changes and show notification only at round start
  useEffect(() => {
    if (!currentRound || !currentRound.drawerId) return;

    // Find drawer in room users
    const drawer = room.users.find((u) => u.userId === currentRound.drawerId);
    if (drawer) {
      const drawerName = drawer.user.username;
      setCurrentDrawerName(drawerName);

      // Only show notification when a round starts (status changes to DRAWING)
      const isRoundStarting =
        currentRound.status === "DRAWING" &&
        // Check if the round has just started (within last few seconds)
        currentRound.startedAt &&
        new Date().getTime() - new Date(currentRound.startedAt).getTime() <
          5000;

      if (isRoundStarting) {
        // Show turn notification
        setShowTurnNotification(true);

        // Play sound effect
        if (turnChangeAudio.current) {
          turnChangeAudio.current
            .play()
            .catch((e) => console.log("Audio play failed:", e));
        }

        // Hide notification after 3 seconds
        setTimeout(() => {
          setShowTurnNotification(false);
        }, 3000);
      }
    }
  }, [
    currentRound?.id,
    currentRound?.status,
    currentRound?.startedAt,
    currentRound?.drawerId,
    room.users,
  ]);

  // Update time left from server time
  useEffect(() => {
    // If we have a server time, use it
    if (roundTimeRemaining !== null) {
      console.log(
        "Setting timeLeft from server:",
        roundTimeRemaining,
        "ms, converting to",
        Math.ceil(roundTimeRemaining / 1000),
        "seconds",
      );
      // Convert milliseconds to seconds for display
      setTimeLeft(Math.ceil(roundTimeRemaining / 1000));
    } else if (currentRound?.status === "WAITING") {
      // Reset timer if round is waiting
      console.log(
        "Round is waiting, setting timeLeft to round duration:",
        roundDuration,
      );
      setTimeLeft(roundDuration);
    } else {
      // Default to full duration if no time remaining is available
      console.log(
        "No roundTimeRemaining available, defaulting to round duration:",
        roundDuration,
      );
      setTimeLeft(roundDuration);
    }
  }, [roundTimeRemaining, currentRound?.status, roundDuration]);

  // Setup polling fallback for timer if needed
  useEffect(() => {
    // Clear existing interval
    if (timerRequestIntervalRef.current) {
      clearInterval(timerRequestIntervalRef.current);
      timerRequestIntervalRef.current = null;
    }

    // Set up polling for both active rounds and transitional states
    const isRoundActive =
      currentRound?.status === "DRAWING" || currentRound?.status === "GUESSING";

    // Also check for rounds that should be active but might be in transition
    const shouldBeActive =
      gameState?.status === "PLAYING" &&
      currentRound?.status === "WAITING" &&
      !!gameState &&
      !!currentRound;

    if ((gameState && currentRound && isRoundActive) || shouldBeActive) {
      // Request timer state immediately
      requestTimerState();

      // Set up interval to request timer state with higher frequency during round transitions
      const intervalTime = shouldBeActive ? 1000 : 5000; // More frequent polling during transitions
      timerRequestIntervalRef.current = setInterval(
        requestTimerState,
        intervalTime,
      );

      console.log(`Timer sync polling set up with ${intervalTime}ms interval`);
    }

    return () => {
      if (timerRequestIntervalRef.current) {
        clearInterval(timerRequestIntervalRef.current);
        timerRequestIntervalRef.current = null;
      }
    };
  }, [
    currentRound?.status,
    gameState?.status,
    gameState?.id,
    currentRound?.id,
    requestTimerState,
  ]);

  // Handle correct guesses to end the round
  useEffect(() => {
    if (!gameState || !currentRound || !gameMessages?.length) return;

    // Check if there are any correct guesses in this round
    const hasCorrectGuess = gameMessages.some(
      (msg) =>
        msg.isCorrect &&
        new Date(msg.createdAt) > new Date(currentRound.startedAt),
    );

    // If a correct guess is found, end the round after a short delay
    if (hasCorrectGuess && currentRound.status === "GUESSING") {
      console.log("Correct guess detected, scheduling round end");

      // Clear any existing correct guess timeout
      if (correctGuessTimeoutRef.current) {
        clearTimeout(correctGuessTimeoutRef.current);
      }

      // Set a timeout to end the round after 2 seconds to give players time to see the correct guess
      correctGuessTimeoutRef.current = setTimeout(() => {
        // Only the drawer or room owner should end the round to avoid multiple calls
        if ((isDrawer || isRoomOwner) && gameState.id) {
          console.log("Ending round after correct guess");
          endRound(gameState.id).catch((err) =>
            console.error("Failed to end round after correct guess:", err),
          );
        }
        correctGuessTimeoutRef.current = null;
      }, 2000);
    }

    // Cleanup
    return () => {
      if (correctGuessTimeoutRef.current) {
        clearTimeout(correctGuessTimeoutRef.current);
        correctGuessTimeoutRef.current = null;
      }
    };
  }, [gameMessages, currentRound, gameState, endRound, isDrawer, isRoomOwner]);

  // Listen for game ended event
  useEffect(() => {
    const handleGameEnded = (game: GameState) => {
      // Find the winner(s)
      const sortedScores = [...game.scores].sort((a, b) => b.score - a.score);
      const highestScore = sortedScores[0]?.score || 0;
      const winners = sortedScores.filter(
        (score) => score.score === highestScore,
      );

      // Set winners and show dialog
      setGameWinners(winners);
      setShowGameEndDialog(true);
    };

    // Add listener for game ended
    gameService.onGameEnded(handleGameEnded);

    // Clean up listener
    return () => {
      gameService.offGameEnded(handleGameEnded);
    };
  }, []);

  // Handle socket events for game started to close dialog for all players
  useEffect(() => {
    const handleGameStarted = () => {
      console.log("Game started event received, closing game end dialog");
      setShowGameEndDialog(false);
    };

    // Add listener for game started
    gameService.onGameStarted(handleGameStarted);

    // Clean up listener
    return () => {
      gameService.offGameStarted(handleGameStarted);
    };
  }, []);

  // Also close dialog when game starts for all players
  useEffect(() => {
    if (gameState?.status === "PLAYING") {
      setShowGameEndDialog(false);
    }
  }, [gameState?.status]);

  // Also check if the game state changes to FINISHED
  useEffect(() => {
    if (gameState?.status === "FINISHED" && scores.length > 0) {
      // Find the winner(s)
      const sortedScores = [...scores].sort((a, b) => b.score - a.score);
      const highestScore = sortedScores[0]?.score || 0;
      const winners = sortedScores.filter(
        (score) => score.score === highestScore,
      );

      // Set winners and show dialog
      setGameWinners(winners);
      setShowGameEndDialog(true);
    }
  }, [gameState?.status, scores]);

  const handleLeaveGame = async () => {
    await leaveRoom(room.id);
    router.push("/join-room");
  };

  // Handle game controls
  const handleStartGame = async () => {
    if (!isRoomOwner) {
      toast.error("Only the room owner can start the game");
      return;
    }

    if (!areAllPlayersReady) {
      toast.error("All players must be ready to start the game");
      return;
    }

    setLoading(true);
    try {
      console.log("Calling startGame with room ID:", room.id);
      // Close the dialog before starting a new game
      setShowGameEndDialog(false);
      const game = await startGame(room.id);
      console.log("startGame response:", game);

      // Check if game was successfully started or an existing game was retrieved
      if (game && game.id) {
        // Game exists and has an ID
        if (game.status === "WAITING") {
          toast.success("Game started!");
        } else if (game.status === "PLAYING") {
          toast.info("Joined existing game in progress");
        } else {
          toast.info("Game retrieved");
        }
      } else {
        console.error("Invalid game data returned:", game);
        toast.error("Failed to start game: Invalid game data returned");
      }
    } catch (error) {
      console.error("Start game error:", error);

      // Handle specific error cases with useful messages
      let errorMessage = "Failed to start game";

      try {
        if (error instanceof Error) {
          errorMessage = error.message;

          // Handle specific error cases
          if (errorMessage.includes("already in progress")) {
            toast.info("Game is already in progress, joining existing game");
            return;
          } else if (errorMessage.includes("null response")) {
            toast.error("Server didn't respond. Please try again.");
            return;
          } else if (errorMessage.includes("Socket not connected")) {
            toast.error("No connection to the game server. Please reconnect.");
            return;
          } else if (errorMessage.includes("invalid")) {
            toast.error("Invalid data received from server. Please try again.");
            return;
          }
        }
      } catch (parseError) {
        console.error("Error handling game start error:", parseError);
      }

      // Display the error message
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleReady = async () => {
    setLoading(true);
    try {
      await toggleReady(room.id);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to toggle ready state";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleStartRound = async () => {
    if (!gameState) {
      toast.error("No active game");
      return;
    }

    setLoading(true);
    try {
      await startRound(gameState.id);
      toast.success("Round started!");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to start round";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEndRound = async () => {
    if (!gameState) {
      toast.error("No active game");
      return;
    }

    setLoading(true);
    try {
      // Clear any correct guess timeout
      if (correctGuessTimeoutRef.current) {
        clearTimeout(correctGuessTimeoutRef.current);
        correctGuessTimeoutRef.current = null;
      }

      await endRound(gameState.id);
      toast.success("Round ended!");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to end round";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Determine game status and available actions
  const isGameWaiting = !gameState || gameState.status === "WAITING";
  const isGamePlaying = gameState && gameState.status === "PLAYING";
  const isRoundWaiting = currentRound && currentRound.status === "WAITING";
  const isRoundActive =
    currentRound &&
    (currentRound.status === "DRAWING" || currentRound.status === "GUESSING");

  return (
    <div className="relative flex flex-col items-center justify-center p-10">
      {/* Ready Status Alert for Game Waiting */}
      {isGameWaiting && !areAllPlayersReady && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-red-800">
          <div className="flex items-center">
            <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
            <span>All players must be ready to start the game</span>
          </div>
        </div>
      )}

      {/* Turn Notification Banner */}
      <AnimatePresence>
        {showTurnNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-1/2 z-50 -translate-x-1/2 rounded-lg border-2 border-amber-500 bg-amber-100 p-3 text-center shadow-lg"
          >
            <div className="flex items-center justify-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <span className="text-lg font-bold text-amber-800">
                {currentDrawerName}&apos;s turn to draw!
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Status Banner */}
      <div className="mb-4 w-full max-w-5xl rounded-lg border-2 border-dashed border-amber-500 bg-[#fffdf7] p-3 text-center shadow-lg">
        {isGameWaiting && (
          <div className="flex flex-col items-center justify-center gap-2 sm:flex-row">
            <span className="text-lg font-bold text-amber-800">
              Waiting for the game to start
            </span>
            {!isRoomOwner && (
              <Button
                onClick={handleToggleReady}
                disabled={loading}
                variant={isCurrentUserReady ? "outline" : "default"}
                className={
                  isCurrentUserReady
                    ? "ml-2 border-green-500 bg-green-100 text-green-700 hover:bg-green-200"
                    : "ml-2 bg-amber-500 text-white hover:bg-amber-600"
                }
              >
                {isCurrentUserReady ? (
                  <>
                    <CheckCircle2 className="mr-1 h-4 w-4" /> Ready
                  </>
                ) : (
                  "I'm Ready"
                )}
              </Button>
            )}
            {isRoomOwner && (
              <>
                <Button
                  onClick={handleToggleReady}
                  disabled={loading}
                  variant={isCurrentUserReady ? "outline" : "default"}
                  className={
                    isCurrentUserReady
                      ? "ml-2 border-green-500 bg-green-100 text-green-700 hover:bg-green-200"
                      : "ml-2 bg-amber-500 text-white hover:bg-amber-600"
                  }
                >
                  {isCurrentUserReady ? (
                    <>
                      <CheckCircle2 className="mr-1 h-4 w-4" /> Ready
                    </>
                  ) : (
                    "I'm Ready"
                  )}
                </Button>
                <Button
                  onClick={handleStartGame}
                  disabled={
                    loading || room.users.length < 2 || !areAllPlayersReady
                  }
                  className="ml-2 bg-amber-500 text-white hover:bg-amber-600"
                >
                  <PlayCircle className="mr-1 h-4 w-4" />
                  Start Game
                </Button>
              </>
            )}
          </div>
        )}

        {isGamePlaying && isRoundWaiting && (
          <div className="flex flex-col items-center justify-center gap-2 sm:flex-row">
            <span className="text-lg font-bold text-amber-800">
              Round{" "}
              {currentRound?.roundNumber || gameState?.currentRoundNum || 1}{" "}
              starting soon...
            </span>
          </div>
        )}

        {isGamePlaying && isRoundActive && (
          <div className="flex flex-col items-center justify-center gap-2 sm:flex-row">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-amber-800">
                Round{" "}
                {currentRound?.roundNumber || gameState?.currentRoundNum || 1} -{" "}
                {currentDrawerName} is drawing
              </span>
              <div className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1">
                <Clock className="h-4 w-4 text-amber-600" />
                <span className="text-amber-800">{timeLeft}s</span>
              </div>
            </div>
            {/* {(isRoomOwner || isDrawer) && (
              <Button
                onClick={handleEndRound}
                disabled={loading}
                variant="outline"
                className="ml-2 border-amber-500 text-amber-800 hover:bg-amber-50"
              >
                <SkipForward className="mr-1 h-4 w-4" />
                Skip Round
              </Button>
            )} */}
          </div>
        )}

        {gameState && gameState.status === "FINISHED" && (
          <div className="flex items-center justify-center">
            <span className="text-lg font-bold text-amber-800">
              Game has ended!
            </span>
            {isRoomOwner && (
              <Button
                onClick={handleStartGame}
                disabled={loading || !areAllPlayersReady}
                className="ml-2 bg-amber-500 text-white hover:bg-amber-600"
              >
                <PlayCircle className="mr-1 h-4 w-4" />
                New Game
              </Button>
            )}

            <Button
              onClick={handleLeaveGame}
              disabled={loading}
              className="ml-2 bg-red-500 text-red-100 hover:bg-red-600 hover:text-red-100"
            >
              Leave Game
            </Button>
          </div>
        )}
      </div>

      <div className="grid w-full max-w-6xl grid-cols-7 gap-4">
        <div className="col-span-7 md:col-span-2">
          <RoomUsers
            users={users}
            currentTurn={
              currentRound?.roundNumber || gameState?.currentRoundNum || 0
            }
            roundTime={Math.ceil(roundDuration / 1000)}
            timeLeft={timeLeft}
            currentDrawerId={currentRound?.drawerId}
            ownerId={room.ownerId}
          />
        </div>
        <div className="col-span-7 md:col-span-3">
          <DrawingBoard />
        </div>
        <div className="col-span-7 md:col-span-2">
          <ChatRoom />
        </div>
      </div>

      {/* Game Result Dialog */}
      <AnimatePresence>
        {showGameEndDialog && (
          <Dialog open={showGameEndDialog} onOpenChange={setShowGameEndDialog}>
            <DialogContent className="border-2 border-amber-500 bg-[#fffdf7] sm:max-w-md">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <DialogHeader>
                  <DialogTitle className="text-center text-2xl font-bold text-amber-800">
                    {gameWinners.length === 1 ? "Game Winner!" : "Game Tied!"}
                  </DialogTitle>
                  <DialogDescription className="text-center text-amber-700">
                    {gameWinners.length === 1
                      ? "Congratulations to the winner!"
                      : "It's a tie between multiple players!"}
                  </DialogDescription>
                </DialogHeader>

                {/* Winners Section */}
                <div className="my-4">
                  <div className="mb-6 flex justify-center gap-4">
                    {gameWinners.map((winner, index) => (
                      <motion.div
                        key={winner.userId}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                          delay: 0.3 + index * 0.1,
                          type: "spring",
                        }}
                        className={`flex flex-col items-center rounded-lg p-4 ${
                          winner.userId === user?.id
                            ? "border-2 border-amber-500 bg-amber-100"
                            : ""
                        }`}
                      >
                        <motion.div
                          className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500"
                          initial={{ rotate: -10 }}
                          animate={{ rotate: [0, -10, 10, 0] }}
                          transition={{
                            duration: 0.5,
                            delay: 0.5 + index * 0.1,
                          }}
                        >
                          {winner.userId === user?.id ? (
                            <Trophy className="h-7 w-7 text-white" />
                          ) : (
                            <Medal className="h-7 w-7 text-white" />
                          )}
                        </motion.div>
                        <span className="font-bold text-amber-800">
                          {winner.user?.username || "Unknown"}
                        </span>
                        <motion.span
                          className="text-amber-600"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.8 + index * 0.1 }}
                        >
                          {winner.score} points
                        </motion.span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Scores Section */}
                <div className="max-h-60 overflow-y-auto rounded-lg bg-white p-3">
                  <h3 className="mb-2 flex items-center text-lg font-semibold text-amber-800">
                    <Award className="mr-2 h-5 w-5 text-amber-500" />
                    Final Scores
                  </h3>
                  <div className="space-y-2">
                    {scores
                      .sort((a, b) => b.score - a.score)
                      .map((score, index) => (
                        <motion.div
                          key={score.userId}
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.1 * index }}
                          className={`flex items-center justify-between rounded-md p-2 ${
                            score.userId === user?.id
                              ? "bg-amber-100"
                              : "bg-gray-50"
                          } ${index < 3 ? "border-l-4 border-amber-500" : ""}`}
                        >
                          <div className="flex items-center">
                            <span className="w-6 text-center font-bold text-amber-700">
                              {index + 1}.
                            </span>
                            <span
                              className={`ml-2 ${score.userId === user?.id ? "font-bold" : ""}`}
                            >
                              {score.user?.username || "Unknown"}
                              {score.userId === user?.id && " (You)"}
                            </span>
                          </div>
                          <span className="font-semibold text-amber-700">
                            {score.score} pts
                          </span>
                        </motion.div>
                      ))}
                  </div>
                </div>

                <DialogFooter>
                  <div className="flex w-full justify-center gap-3">
                    {isRoomOwner && (
                      <Button
                        onClick={() => {
                          handleStartGame();
                        }}
                        className="bg-amber-500 text-white hover:bg-amber-600"
                      >
                        New Game
                      </Button>
                    )}
                    <Button
                      onClick={() => setShowGameEndDialog(false)}
                      variant="outline"
                      className="border-amber-500 text-amber-700 hover:bg-amber-50"
                    >
                      Close
                    </Button>
                  </div>
                </DialogFooter>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}
