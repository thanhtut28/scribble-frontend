"use client";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface StrokeSelectBoxProps {
  strokeWidth: number;
  setStrokeWidth: (strokeWidth: number) => void;
}

export const StrokeSelectBox = ({
  strokeWidth,
  setStrokeWidth,
}: StrokeSelectBoxProps) => {
  return (
    <Select
      value={strokeWidth.toString()}
      onValueChange={(value) => setStrokeWidth(Number(value))}
    >
      <SelectTrigger
        className="flex w-12 items-center justify-center border-2 border-amber-300 bg-white p-0 shadow-md [&>svg]:hidden"
        style={{ height: "48px" }}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="w-12 border-2 border-amber-300 p-0">
        <div className="grid w-full grid-cols-1 p-0">
          {[2, 4, 8, 16, 20].map((size) => (
            <SelectItem
              key={size}
              value={size.toString()}
              className="flex h-12 w-full cursor-pointer items-center justify-center rounded-xs p-0 hover:bg-amber-50"
            >
              <div
                className="rounded-full bg-amber-600"
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  minWidth: `${size}px`,
                  minHeight: `${size}px`,
                }}
              />
            </SelectItem>
          ))}
        </div>
      </SelectContent>
    </Select>
  );
};
