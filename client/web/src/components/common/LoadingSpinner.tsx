import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
};

export function LoadingSpinner({
  size = "md",
  className,
  label,
}: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      className="inline-flex items-center justify-center gap-2"
    >
      <Loader2
        className={cn(
          "animate-spin text-indigo-600 dark:text-indigo-400",
          sizeClasses[size],
          className,
        )}
      />
      {label && (
        <span className="text-sm text-slate-500 dark:text-neutral-400 font-medium">
          {label}
        </span>
      )}
      <span className="sr-only">{label || "Loading"}</span>
    </div>
  );
}
