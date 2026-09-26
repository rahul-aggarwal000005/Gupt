"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LoadingOverlayProps {
  message?: string;
  className?: string;
}

export function LoadingOverlay({
  message = "Loading...",
  className,
}: LoadingOverlayProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 w-full h-full rounded-[inherit] z-50 flex flex-col items-center justify-center bg-white/85 dark:bg-neutral-950/85 backdrop-blur-md p-6 transition-all duration-200",
        className,
      )}
    >
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="relative flex items-center justify-center w-14 h-14">
          {/* Outer glowing spinning ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-indigo-600 border-r-indigo-400 dark:border-t-indigo-400 dark:border-r-cyan-400"
          />

          {/* Inner counter-spinning faint ring */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
            className="absolute inset-1.5 rounded-full border border-indigo-200/50 dark:border-indigo-800/50 border-b-indigo-500"
          />

          {/* Center pulsing shield icon */}
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs"
          >
            <Shield className="w-4 h-4" />
          </motion.div>
        </div>

        {message && (
          <p className="text-sm font-medium text-slate-800 dark:text-neutral-100 tracking-wide text-center animate-pulse">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
