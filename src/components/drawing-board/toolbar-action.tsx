"use client";

import type React from "react";

import { Eraser, Pen, Redo, RotateCcw, Undo } from "lucide-react";
import { StrokeSelectBox } from "./stroke-selectbox";
import type { ReactSketchCanvasRef } from "react-sketch-canvas";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from "framer-motion";
import { useGame } from "@/lib/providers/game-provider";
import { DrawingPath } from "@/lib/services/game.service";

interface ToolbarActionProps {
  eraseMode: boolean;
  setStrokeWidth: (strokeWidth: number) => void;
  strokeWidth: number;
  canvasRef: React.RefObject<ReactSketchCanvasRef | null>;
  setEraseMode: (eraseMode: boolean) => void;
}

interface ExtendedCanvasPath {
  drawMode: boolean;
  isEraser?: boolean;
  strokeColor: string;
  strokeWidth: number;
  paths: { x: number; y: number }[];
}

const ToolbarAction = ({
  eraseMode,
  setStrokeWidth,
  strokeWidth,
  canvasRef,
  setEraseMode,
}: ToolbarActionProps) => {
  const { updateDrawing, gameState, currentRound, isDrawer } = useGame();

  // Helper function to update the drawing
  const updateDrawingAfterAction = async () => {
    if (!gameState || !currentRound || !isDrawer) return;

    try {
      // Get all paths from the canvas
      const exportedPaths = await canvasRef.current?.exportPaths();
      if (!exportedPaths) return;

      // Convert paths to the format expected by the server
      const drawingPaths = exportedPaths.map((path) => {
        const pathWithEraser = path as ExtendedCanvasPath;
        return {
          drawMode: !(pathWithEraser.isEraser ?? false),
          strokeColor: pathWithEraser.strokeColor,
          strokeWidth: pathWithEraser.strokeWidth,
          points: pathWithEraser.paths.map((point) => ({
            x: point.x,
            y: point.y,
          })),
        };
      }) as DrawingPath[];

      // Send to server
      if (gameState.status === "PLAYING") {
        updateDrawing(drawingPaths);
      }
    } catch (error) {
      console.error("Error updating drawing:", error);
    }
  };

  function handleEraserClick() {
    setEraseMode(true);
    const _canvas = canvasRef.current?.eraseMode(true);
    setTimeout(updateDrawingAfterAction, 100);
  }

  function handlePenClick() {
    setEraseMode(false);
    canvasRef.current?.eraseMode(false);
    setTimeout(updateDrawingAfterAction, 100);
  }

  function handleUndoClick() {
    canvasRef.current?.undo();
    setTimeout(updateDrawingAfterAction, 100);
  }

  function handleRedoClick() {
    canvasRef.current?.redo();
    setTimeout(updateDrawingAfterAction, 100);
  }

  function handleClearClick() {
    canvasRef.current?.clearCanvas();
    setTimeout(updateDrawingAfterAction, 100);
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center justify-center gap-4">
        {/* New Tab-Style Toggle */}
        <div className="flex h-12 items-center justify-center rounded-lg border-2 border-amber-300 bg-white p-1 shadow-md">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative">
                <motion.button
                  type="button"
                  onClick={handlePenClick}
                  className="relative z-10 flex h-10 w-10 items-center justify-center rounded transition-colors"
                  whileTap={{ scale: 0.95 }}
                >
                  <Pen
                    size={16}
                    className={!eraseMode ? "text-amber-600" : "text-gray-500"}
                  />
                </motion.button>
                {!eraseMode && (
                  <motion.div
                    className="absolute inset-0 rounded-md bg-amber-200 shadow-sm"
                    layoutId="toolBackground"
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                    }}
                  />
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              className="border-amber-300 bg-amber-50 text-amber-800"
            >
              <p>Pen</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="relative">
                <motion.button
                  type="button"
                  onClick={handleEraserClick}
                  className="relative z-10 flex h-10 w-10 items-center justify-center rounded transition-colors"
                  whileTap={{ scale: 0.95 }}
                >
                  <Eraser
                    size={16}
                    className={eraseMode ? "text-amber-600" : "text-gray-500"}
                  />
                </motion.button>
                {eraseMode && (
                  <motion.div
                    className="absolute inset-0 rounded-md bg-amber-200 shadow-sm"
                    layoutId="toolBackground"
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                    }}
                  />
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              className="border-amber-300 bg-amber-50 text-amber-800"
            >
              <p>Eraser</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Stroke width */}
        <div>
          <StrokeSelectBox
            strokeWidth={strokeWidth}
            setStrokeWidth={(width) => {
              setStrokeWidth(width);
              setTimeout(updateDrawingAfterAction, 100);
            }}
          />
        </div>

        {/* Actions */}
        <div className="flex h-12 items-center gap-1 rounded-lg border-2 border-amber-300 bg-white p-2 shadow-md">
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                type="button"
                onClick={handleUndoClick}
                className="flex h-9 w-9 items-center justify-center rounded text-gray-700 transition-colors hover:bg-amber-100 hover:text-amber-600"
                whileTap={{ scale: 0.95 }}
              >
                <Undo size={16} />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              className="border-amber-300 bg-amber-50 text-amber-800"
            >
              <p>Undo</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                type="button"
                onClick={handleRedoClick}
                className="flex h-9 w-9 items-center justify-center rounded text-gray-700 transition-colors hover:bg-amber-100 hover:text-amber-600"
                whileTap={{ scale: 0.95 }}
              >
                <Redo size={16} />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              className="border-amber-300 bg-amber-50 text-amber-800"
            >
              <p>Redo</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <motion.button
                type="button"
                onClick={handleClearClick}
                className="flex h-9 w-9 items-center justify-center rounded text-gray-700 transition-colors hover:bg-red-100 hover:text-rose-500"
                whileTap={{ scale: 0.95 }}
              >
                <RotateCcw size={16} />
              </motion.button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              className="border-amber-300 bg-amber-50 text-amber-800"
            >
              <p>Clear Canvas</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default ToolbarAction;
