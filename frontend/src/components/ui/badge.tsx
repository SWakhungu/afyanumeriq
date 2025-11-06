"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "warning" | "success" | "outline";
}

export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const base =
      variant === "destructive"
        ? "bg-red-600 text-white"
        : variant === "secondary"
        ? "bg-gray-200 text-gray-800"
        : variant === "warning"
        ? "bg-amber-400 text-black"
        : variant === "success"
        ? "bg-green-500 text-white"
        : variant === "outline"
        ? "border border-gray-400 text-gray-800"
        : "bg-blue-600 text-white";
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
          base,
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";
