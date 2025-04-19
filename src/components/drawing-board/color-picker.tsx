"use client";

import type React from "react";

import { cn } from "@/lib/utils";
import type { ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Palette } from "lucide-react";

interface ColorPickerProps {
  strokeColor: string;
  colorInputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (color: string) => void;
}

export function ColorPicker({
  onChange,
  strokeColor,
  colorInputRef,
}: ColorPickerProps) {
  // Color palette matching the image
  const colors = [
    "#FFFFFF", // white
    "#9BAEC8", // light gray
    "#FF0000", // red
    "#FF7F00", // orange
    "#FFFF00", // yellow
    "#00FF00", // green
    "#00FFFF", // cyan
    "#0080FF", // light blue
    "#0000FF", // blue
    "#8B00FF", // violet
    "#FF00FF", // magenta
    "#FFC0CB", // pink
    "#FFA07A", // light salmon
    "#8B4513", // brown
    "#000000", // black
    "#4F545C", // dark gray
    "#800000", // dark red
    "#FF8C00", // dark orange
    "#808000", // olive
    "#008000", // dark green
  ];

  function handleStrokeColorChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value);
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="icon"
        type="button"
        onClick={() => colorInputRef.current?.click()}
        className="h-12 w-12 rounded-md border-2 border-amber-300 shadow-lg dark:border-amber-700"
        style={{ backgroundColor: strokeColor }}
      >
        <input
          type="color"
          ref={colorInputRef}
          className="sr-only"
          value={strokeColor}
          onChange={handleStrokeColorChange}
        />
        <Palette className="h-5 w-5 text-white opacity-70" />
      </Button>
      <div className="border-2 border-amber-300 shadow-lg dark:border-amber-700">
        <div className="grid grid-cols-5 sm:grid-cols-10">
          {colors.map((color) => (
            <button
              key={color}
              type="button"
              className="relative m-0 h-[30px] w-[30px] p-0 transition-transform outline-none hover:scale-110"
              style={{ backgroundColor: color }}
              onClick={() => {
                onChange(color);
              }}
              aria-label={`Select color ${color}`}
            >
              <div
                className={cn(
                  "absolute inset-[3px] rounded-[2px] opacity-0 transition-opacity",
                  "group-hover:opacity-100 hover:opacity-100",
                  color === strokeColor ? "opacity-100" : "",
                )}
                style={{
                  boxShadow: "inset 0 0 0 2px #FF8C00",
                }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
