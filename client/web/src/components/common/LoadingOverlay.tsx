import * as React from "react";
import { LoadingSpinner } from "./LoadingSpinner";
import { cn } from "@/lib/utils";

export interface LoadingOverlayProps {
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

export function LoadingOverlay({
  message = "Loading...",
  fullScreen = false,
  className,
}: LoadingOverlayProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center bg-white/70 dark:bg-neutral-950/70 backdrop-blur-md z-50",
        fullScreen
          ? "fixed inset-0 min-h-screen w-screen"
          : "absolute inset-0 w-full h-full rounded-[inherit]",
        className,
      )}
    >
      <LoadingSpinner size="lg" />
      {message && (
        <p className="mt-4 text-sm font-medium text-slate-600 dark:text-neutral-300 animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
}
