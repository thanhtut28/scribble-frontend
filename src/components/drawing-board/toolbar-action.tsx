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

interface ToolbarActionProps {
  eraseMode: boolean;
  setStrokeWidth: (strokeWidth: number) => void;
  strokeWidth: number;
  canvasRef: React.RefObject<ReactSketchCanvasRef | null>;
  setEraseMode: (eraseMode: boolean) => void;
}

const ToolbarAction = ({
  eraseMode,
  setStrokeWidth,
  strokeWidth,
  canvasRef,
  setEraseMode,
}: ToolbarActionProps) => {
  function handleEraserClick() {
    setEraseMode(true);
    canvasRef.current?.eraseMode(true);
  }

  function handlePenClick() {
    setEraseMode(false);
    canvasRef.current?.eraseMode(false);
  }

  function handleUndoClick() {
    canvasRef.current?.undo();
  }

  function handleRedoClick() {
    canvasRef.current?.redo();
  }

  function handleClearClick() {
    canvasRef.current?.clearCanvas();
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
            setStrokeWidth={setStrokeWidth}
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
