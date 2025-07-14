"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import {
  ReactSketchCanvas,
  type ReactSketchCanvasRef,
  type CanvasPath,
} from "react-sketch-canvas";

import { ColorPicker } from "./color-picker";
import ToolbarAction from "./toolbar-action";
import { Sparkles, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { useGame } from "@/lib/providers/game-provider";
import { DrawingPath, gameService } from "@/lib/services/game.service";

interface DrawingBoardProps {
  readOnly?: boolean;
}

// Extended CanvasPath interface to include isEraser property
interface ExtendedCanvasPath extends CanvasPath {
  isEraser?: boolean;
}

export default function DrawingBoard({ readOnly = false }: DrawingBoardProps) {
  const colorInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<ReactSketchCanvasRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [strokeColor, setStrokeColor] = useState("#FF8C00"); // Default to amber color
  const [eraseMode, setEraseMode] = useState(false);
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [canvasDimensions, setCanvasDimensions] = useState({
    width: "100%",
    height: "430px",
  });
  const [paths, setPaths] = useState<DrawingPath[]>([]);
  const [localPaths, setLocalPaths] = useState<ExtendedCanvasPath[]>([]);
  const [pendingRedraw, setPendingRedraw] = useState(false);
  const [lastRoundId, setLastRoundId] = useState<string | null>(null);

  const {
    gameState,
    currentRound,
    isDrawer,
    updateDrawing,
    roundTimeRemaining,
    roundDuration,
  } = useGame();

  // Determine if the canvas should be read-only
  const isReadOnly = readOnly || !isDrawer;

  // Handle resize to maintain aspect ratio or adjust canvas size
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        const aspectRatio = 600 / 430;
        const height = width / aspectRatio;

        setCanvasDimensions({
          width: `${width}px`,
          height: `${height}px`,
        });
      }
    };

    // Run on initial mount
    handleResize();

    // Listen for window resize
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Convert React Sketch Canvas paths to our DrawingPath format
  const convertPathsToDrawingPaths = (
    canvasPaths: ExtendedCanvasPath[],
  ): DrawingPath[] => {
    return canvasPaths.map((path) => ({
      drawMode: !(path.isEraser ?? false),
      strokeColor: path.strokeColor,
      strokeWidth: path.strokeWidth,
      points: path.paths.map((point) => ({
        x: point.x,
        y: point.y,
      })),
    }));
  };

  // Calculate word masking based on timer progress
  const maskedWord = useMemo(() => {
    if (!currentRound?.word) return "";

    const word = currentRound.word;
    const wordLength = word.length;

    // All characters are masked at the beginning
    if (!roundTimeRemaining || roundTimeRemaining >= roundDuration * 1000) {
      return "*".repeat(wordLength);
    }

    // Calculate time progress (0 to 1)
    const timeProgress = 1 - roundTimeRemaining / (roundDuration * 1000);

    // Limit revealed characters to 60% of word length
    const maxRevealed = Math.floor(wordLength * 0.6);

    // Calculate how many characters should be revealed at current time
    // We want to reveal characters one by one at regular intervals
    // Define how many characters to reveal based on time passed
    const totalRevealSteps = maxRevealed;
    const revealInterval = 1 / totalRevealSteps; // Time progress needed to reveal each character

    // Calculate current number of characters to reveal (at most one new char per interval)
    const charsToReveal = Math.min(
      Math.floor(timeProgress / revealInterval),
      maxRevealed,
    );

    // Create a structured pattern for revealing letters (not random)
    // Use specific positions that make the word recognizable early
    // Start with vowels, then move to consonants in a distributed pattern

    // Create prioritized positions based on word structure
    const positions = [];

    // First add vowel positions (for common word structure recognition)
    const vowelIndices = [];
    for (let i = 0; i < wordLength; i++) {
      const char = word[i].toLowerCase();
      if ("aeiou".includes(char)) {
        vowelIndices.push(i);
      }
    }

    // Then add consonant positions
    const consonantIndices = [];
    for (let i = 0; i < wordLength; i++) {
      if (!vowelIndices.includes(i)) {
        consonantIndices.push(i);
      }
    }

    // Combine with vowels first, then consonants
    positions.push(...vowelIndices, ...consonantIndices);

    // Limit to max positions we might need
    const revealPositions = positions.slice(0, maxRevealed);

    // Get the positions to reveal based on current progress
    const activeRevealPositions = revealPositions.slice(0, charsToReveal);

    // Build the masked word
    return word
      .split("")
      .map((char, index) =>
        activeRevealPositions.includes(index) ? char : "*",
      )
      .join("");
  }, [currentRound?.word, roundTimeRemaining, roundDuration]);

  // Convert our DrawingPath format to React Sketch Canvas paths
  const convertDrawingPathsToCanvasPaths = (
    drawingPaths: DrawingPath[],
  ): ExtendedCanvasPath[] => {
    return drawingPaths.map((path) => ({
      drawMode: path.drawMode,
      isEraser: !path.drawMode,
      strokeColor: path.strokeColor,
      strokeWidth: path.strokeWidth,
      paths: path.points.map((point) => ({
        x: point.x,
        y: point.y,
      })),
    }));
  };

  // Handle drawing strokes
  const handleStroke = async (path: CanvasPath, isEraser: boolean) => {
    if (isReadOnly) return;

    try {
      // Get all paths from the canvas
      const exportedPaths = await canvasRef.current?.exportPaths();
      if (!exportedPaths) return;

      // Add isEraser property to exported paths
      const extendedPaths = exportedPaths.map((p, index) => {
        if (index === exportedPaths.length - 1) {
          return { ...p, isEraser };
        }
        return p;
      }) as ExtendedCanvasPath[];

      setLocalPaths(extendedPaths);

      // Convert to our format
      const drawingPaths = convertPathsToDrawingPaths(extendedPaths);
      setPaths(drawingPaths);

      // Send to server only if game is in progress and we are the drawer
      if (
        gameState &&
        gameState.status === "PLAYING" &&
        currentRound &&
        isDrawer
      ) {
        updateDrawing(drawingPaths);
      }
    } catch (error) {
      console.error("Error handling stroke:", error);
    }
  };

  // Clear canvas when round changes
  useEffect(() => {
    if (!currentRound) return;

    // If round ID changed, we need to clear the canvas
    if (lastRoundId && lastRoundId !== currentRound.id) {
      console.log("Round changed, clearing canvas", {
        lastRoundId,
        newRoundId: currentRound.id,
      });

      // Clear local state
      setPaths([]);
      setLocalPaths([]);

      // Clear canvas element
      if (canvasRef.current) {
        canvasRef.current.clearCanvas();
        canvasRef.current.resetCanvas();
      }
    }

    // Update the last round ID
    setLastRoundId(currentRound.id);
  }, [currentRound?.id]);

  // Listen for drawing updates from other users
  useEffect(() => {
    if (!gameState || !currentRound) return;

    // Get initial drawings if available
    if (currentRound.drawings && currentRound.drawings.length > 0) {
      const latestDrawing =
        currentRound.drawings[currentRound.drawings.length - 1];
      if (latestDrawing?.paths) {
        console.log("Found initial drawing paths:", latestDrawing.paths.length);

        // Only clear canvas if we're starting a new round, not on timer updates
        // Check if gameState has preserveDrawing flag to avoid clearing
        if (canvasRef.current && !gameState.preserveDrawing) {
          canvasRef.current.clearCanvas();
        }

        setPaths(latestDrawing.paths as DrawingPath[]);

        // Convert and set to canvas if we're not the drawer
        if (!isDrawer) {
          console.log("Setting initial drawing paths for non-drawer");
          const canvasPaths = convertDrawingPathsToCanvasPaths(
            latestDrawing.paths as DrawingPath[],
          );
          setLocalPaths(canvasPaths);
          setPendingRedraw(true);
        }
      } else {
        // If no paths and no preserveDrawing flag, ensure canvas is clear
        if (canvasRef.current && !gameState.preserveDrawing) {
          canvasRef.current.clearCanvas();
        }
        setPaths([]);
        setLocalPaths([]);
      }
    } else {
      // If no drawings and no preserveDrawing flag, ensure canvas is clear
      if (canvasRef.current && !gameState.preserveDrawing) {
        canvasRef.current.clearCanvas();
      }
      setPaths([]);
      setLocalPaths([]);
    }

    // Set up event listener for drawing updates
    const handleDrawingUpdate = (data: {
      gameId: string;
      roundId: string;
      paths: DrawingPath[];
    }) => {
      console.log("Drawing update received:", {
        gameId: data.gameId,
        roundId: data.roundId,
        pathsCount: data.paths.length,
      });

      // Verify that we have the correct game and round
      if (!gameState) {
        console.error("Received drawing update but game state is null");
        return;
      }

      if (!currentRound) {
        console.error("Received drawing update but current round is null");
        return;
      }

      if (data.gameId !== gameState.id) {
        console.error(
          `Drawing update gameId mismatch: received ${data.gameId}, expected ${gameState.id}`,
        );
        return;
      }

      if (data.roundId !== currentRound.id) {
        console.error(
          `Drawing update roundId mismatch: received ${data.roundId}, expected ${currentRound.id}`,
        );
        return;
      }

      console.log("Setting paths from drawing update");
      setPaths(data.paths);

      // Only update the canvas if we're not the drawer
      if (!isDrawer) {
        console.log("Updating canvas for non-drawer");
        const canvasPaths = convertDrawingPathsToCanvasPaths(data.paths);
        setLocalPaths(canvasPaths);
        setPendingRedraw(true);
      }
    };

    // Register event listener
    gameService.onDrawingUpdated(handleDrawingUpdate);

    return () => {
      // Clean up event listener
      gameService.offDrawingUpdated(handleDrawingUpdate);
    };
  }, [gameState, currentRound, isDrawer, updateDrawing]);

  // Redraw canvas when paths change (for non-drawers)
  useEffect(() => {
    if (!pendingRedraw || isDrawer || !canvasRef.current) return;

    const redrawCanvas = async () => {
      try {
        // Clear the canvas
        await canvasRef.current?.clearCanvas();

        // We need to manually redraw each path because the library doesn't support loadPaths
        // First, create a temporary canvas context to draw with
        if (!currentRound || !currentRound.drawings) return;

        // Convert DrawingPath[] to CanvasPath[] format expected by loadPaths
        const drawing =
          currentRound.drawings[currentRound.drawings.length - 1].paths;
        const canvasPaths = convertDrawingPathsToCanvasPaths(drawing);
        console.log("canvasPaths", canvasPaths);

        const canvasElement = canvasRef.current?.loadPaths(canvasPaths);
        if (!canvasElement) return;

        // For now, just mark the redraw as complete
        // In a full implementation, we would need to use a custom approach to redraw paths
        // This would require either using canvas APIs directly or finding another drawing library

        setPendingRedraw(false);

        // Signal that a complete redraw is needed on next render by clearing and forcing update
        if (localPaths.length > 0) {
          // This is a workaround to force a re-render with the paths
          setTimeout(() => {
            canvasRef.current?.clearCanvas();
          }, 50);
        }
      } catch (error) {
        console.error("Error redrawing canvas:", error);
        setPendingRedraw(false);
      }
    };

    redrawCanvas();
  }, [localPaths, isDrawer, pendingRedraw, currentRound]);

  // Manual rendering for viewers
  useEffect(() => {
    // Only for non-drawers
    if (isDrawer || !canvasRef.current || !paths.length) return;

    // We need to manually draw the paths received from the server
    // Since the ReactSketchCanvas doesn't expose a way to load paths directly
    const drawImageFromPaths = async () => {
      try {
        // First clear the canvas
        await canvasRef.current?.clearCanvas();
        // Convert the received paths to the format expected by ReactSketchCanvas
        if (
          currentRound?.drawings &&
          currentRound.drawings[currentRound.drawings.length - 1]?.paths
        ) {
          const drawingPaths =
            currentRound.drawings[currentRound.drawings.length - 1].paths;
          const canvasPaths = convertDrawingPathsToCanvasPaths(drawingPaths);

          // Use the loadPaths method to render the paths
          canvasRef.current?.loadPaths(canvasPaths);

          console.log("Loaded drawing paths from server:", drawingPaths.length);
        } else {
          console.log("No drawing paths available to render");
        }

        // Force a refresh of the component
        setPendingRedraw(false);
      } catch (error) {
        console.error("Error drawing image from paths:", error);
      }
    };

    drawImageFromPaths();
  }, [paths, isDrawer, currentRound]);

  console.log("canvasRef", canvasRef.current);

  return (
    <div
      className="relative mx-auto mt-6 flex w-full max-w-2xl flex-col gap-4 rounded-lg border-2 border-dashed border-amber-500 bg-[#fffdf7] p-4 shadow-lg"
      ref={containerRef}
    >
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 h-16 w-16 rounded-bl-full bg-blue-100 opacity-50"></div>
      <div className="absolute bottom-0 left-0 h-20 w-20 rounded-tr-full bg-red-100 opacity-50"></div>

      <div className="relative aspect-[600/430] w-full overflow-hidden rounded-lg border-2 border-amber-300 bg-white shadow-inner sm:aspect-auto sm:h-[430px]">
        {/* Locked overlay for non-drawers */}
        {/* {isReadOnly && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/5 backdrop-blur-[1px]">
            <div className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 shadow-lg">
              <Lock className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium text-amber-800">
                {currentRound?.status === "WAITING"
                  ? "Waiting for the round to start..."
                  : "Only the drawer can draw"}
              </span>
            </div>
          </div>
        )} */}

        <ReactSketchCanvas
          onStroke={handleStroke}
          width={canvasDimensions.width}
          height={canvasDimensions.height}
          ref={canvasRef}
          strokeColor={strokeColor}
          strokeWidth={strokeWidth}
          canvasColor="white"
          className="!h-full !w-full !rounded-[2px]"
          preserveBackgroundImageAspectRatio="none"
          style={{ pointerEvents: isReadOnly ? "none" : "auto" }}
        />

        {/* Word display for the drawer */}
        {isDrawer && gameState && currentRound && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-4 py-1 text-white shadow-md">
            <span className="font-medium">Draw: {currentRound.word}</span>
          </div>
        )}

        {/* Word display for guessers with progressive reveal */}
        {!isDrawer && gameState && currentRound && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-4 py-1 text-white shadow-md">
            <span className="flex items-center gap-1 font-medium">
              <span className="mr-1">Word:</span>
              {maskedWord.split("").map((char, index) => (
                <span
                  key={index}
                  className={`transition-all duration-300 ${
                    char === "*" ? "opacity-60" : "font-bold opacity-100"
                  }`}
                >
                  {char}
                </span>
              ))}
            </span>
          </div>
        )}

        {/* Decorative sparkles */}
        <motion.div
          className="absolute top-2 right-2 text-amber-400"
          animate={{
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 0.9, 1],
          }}
          transition={{
            repeat: Number.POSITIVE_INFINITY,
            duration: 4,
          }}
        >
          <Sparkles className="h-5 w-5" />
        </motion.div>
      </div>

      {/* Only show tools for the drawer */}
      {!isReadOnly && (
        <div className="flex flex-wrap items-center justify-center gap-4">
          {/* Color picker */}
          <ColorPicker
            onChange={setStrokeColor}
            strokeColor={strokeColor}
            colorInputRef={colorInputRef}
          />

          {/* Toolbar Action*/}
          <ToolbarAction
            eraseMode={eraseMode}
            setStrokeWidth={setStrokeWidth}
            strokeWidth={strokeWidth}
            canvasRef={canvasRef}
            setEraseMode={setEraseMode}
          />
        </div>
      )}
    </div>
  );
}
