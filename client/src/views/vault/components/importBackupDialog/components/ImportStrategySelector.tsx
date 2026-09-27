"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { GitMerge, Replace, AlertTriangle } from "lucide-react";

export type ImportStrategy = "merge" | "replace";

interface ImportStrategySelectorProps {
  importMode: ImportStrategy;
  onStrategyChange: (mode: ImportStrategy) => void;
}

export function ImportStrategySelector({
  importMode,
  onStrategyChange,
}: ImportStrategySelectorProps) {
  return (
    <div className="space-y-2.5">
      <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
        Import Strategy
      </Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onStrategyChange("merge")}
          className={`text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
            importMode === "merge"
              ? "border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 ring-2 ring-indigo-500/20"
              : "border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 bg-white dark:bg-neutral-900"
          }`}
        >
          <div className="flex items-center gap-2 font-medium text-sm text-slate-900 dark:text-white">
            <GitMerge className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>Merge (Default)</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            Blends with current items. Newer revisions take precedence (LWW).
          </p>
        </button>

        <button
          type="button"
          onClick={() => onStrategyChange("replace")}
          className={`text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
            importMode === "replace"
              ? "border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 ring-2 ring-amber-500/20"
              : "border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 bg-white dark:bg-neutral-900"
          }`}
        >
          <div className="flex items-center gap-2 font-medium text-sm text-amber-700 dark:text-amber-400">
            <Replace className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Replace</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            Overwrites your entire vault with the exact items in the backup.
          </p>
        </button>
      </div>

      {/* Warning banner when Replace is active */}
      {importMode === "replace" && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 text-xs border border-amber-200/60 dark:border-amber-800/40 animate-in fade-in-50 duration-200">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <span>
            <strong>Warning:</strong> Current vault items not present in this
            backup will be permanently removed upon synchronization.
          </span>
        </div>
      )}
    </div>
  );
}
