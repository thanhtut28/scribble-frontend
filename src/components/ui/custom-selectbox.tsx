import React from "react";
import {
  SelectContent as OriginalSelectContent,
  SelectItem as OriginalSelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const CustomSelectContent = React.forwardRef<
  React.ElementRef<typeof OriginalSelectContent>,
  React.ComponentPropsWithoutRef<typeof OriginalSelectContent> & {
    title?: string;
  }
>(({ className, title, children, ...props }, ref) => (
  <OriginalSelectContent
    ref={ref}
    className={cn(
      "border-2 border-dashed border-amber-300 bg-[#fffdf7] p-1 shadow-md",
      className,
    )}
    {...props}
  >
    {title && (
      <div className="mb-1 px-2 text-xs font-medium text-amber-700">
        {title}
      </div>
    )}
    <div className="max-h-[200px] overflow-y-auto rounded-md bg-white/80 p-1">
      {children}
    </div>
  </OriginalSelectContent>
));
CustomSelectContent.displayName = "CustomSelectContent";

export const CustomSelectItem = React.forwardRef<
  React.ElementRef<typeof OriginalSelectItem>,
  React.ComponentPropsWithoutRef<typeof OriginalSelectItem> & {
    colorDot?: string;
  }
>(({ className, children, colorDot, ...props }, ref) => (
  <OriginalSelectItem
    ref={ref}
    className={cn(
      "flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-amber-100 focus:bg-amber-100 data-[state=checked]:bg-amber-200 data-[state=checked]:text-amber-800",
      className,
    )}
    {...props}
  >
    {colorDot ? (
      <div className="flex items-center">
        <div className={`mr-2 h-3 w-3 rounded-full ${colorDot}`}></div>
        {children}
      </div>
    ) : (
      children
    )}
  </OriginalSelectItem>
));
CustomSelectItem.displayName = "CustomSelectItem";
