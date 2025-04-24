"use client";

import { useRef, useState, useEffect } from "react";
import {
  ReactSketchCanvas,
  type ReactSketchCanvasRef,
} from "react-sketch-canvas";

import { ColorPicker } from "./color-picker";
import ToolbarAction from "./toolbar-action";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function Canvas() {
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

  return (
    <div
      className="relative mx-auto mt-6 flex w-full max-w-2xl flex-col gap-4 rounded-lg border-2 border-dashed border-amber-500 bg-[#fffdf7] p-4 shadow-lg"
      ref={containerRef}
    >
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 h-16 w-16 rounded-bl-full bg-blue-100 opacity-50"></div>
      <div className="absolute bottom-0 left-0 h-20 w-20 rounded-tr-full bg-red-100 opacity-50"></div>

      <div className="relative aspect-[600/430] w-full overflow-hidden rounded-lg border-2 border-amber-300 bg-white shadow-inner sm:aspect-auto sm:h-[430px]">
        <ReactSketchCanvas
          width={canvasDimensions.width}
          height={canvasDimensions.height}
          ref={canvasRef}
          strokeColor={strokeColor}
          strokeWidth={strokeWidth}
          canvasColor="white"
          className="!h-full !w-full !rounded-[2px]"
          preserveBackgroundImageAspectRatio="none"
        />

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
    </div>
  );
}
