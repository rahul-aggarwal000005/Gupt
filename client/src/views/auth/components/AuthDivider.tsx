import * as React from "react";
import { cn } from "@/lib/utils";

export interface AuthDividerProps {
  text?: string;
  className?: string;
}

export function AuthDivider({
  text = "Or continue with",
  className,
}: AuthDividerProps) {
  return (
    <div className={cn("relative w-full py-2", className)}>
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-slate-200 dark:border-neutral-800" />
      </div>
      <div className="relative flex justify-center text-xs uppercase font-semibold tracking-wider">
        <span className="bg-white/70 dark:bg-neutral-900/70 px-2 text-slate-400 backdrop-blur-xl">
          {text}
        </span>
      </div>
    </div>
  );
}
