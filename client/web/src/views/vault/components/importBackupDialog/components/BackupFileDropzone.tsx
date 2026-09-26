"use client";

import React from "react";
import { CheckCircle2, FileText } from "lucide-react";

interface BackupFileDropzoneProps {
  selectedFile: File | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function BackupFileDropzone({
  selectedFile,
  fileInputRef,
  onFileSelect,
}: BackupFileDropzoneProps) {
  return (
    <>
      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={onFileSelect}
      />

      {/* File Selector Dropzone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className={`group border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center gap-2.5 text-center cursor-pointer transition-all duration-200 ${
          selectedFile
            ? "border-indigo-500/50 bg-indigo-50/30 dark:bg-indigo-950/20"
            : "border-slate-200 dark:border-neutral-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-50/50 dark:hover:bg-neutral-800/30"
        }`}
      >
        {selectedFile ? (
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-sm font-semibold text-slate-900 dark:text-white break-all max-w-[320px]">
              {selectedFile.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {(selectedFile.size / 1024).toFixed(1)} KB • Click to choose a
              different file
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center group-hover:scale-105 transition-transform text-slate-600 dark:text-slate-300">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-slate-900 dark:text-white">
              Click to select backup file
            </span>
            <span className="text-xs text-muted-foreground">
              Encrypted JSON files up to 10MB
            </span>
          </div>
        )}
      </div>
    </>
  );
}
