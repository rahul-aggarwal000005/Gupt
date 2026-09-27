"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Shield,
  RefreshCw,
  Upload,
  Download,
  Settings,
  Lock,
} from "lucide-react";

export interface VaultHeaderProps {
  onSync: () => void;
  isSyncing: boolean;
  syncError: boolean | string | null;
  onImportOpen: () => void;
  onExport: () => void;
  onLock: () => void;
}

export function VaultHeader({
  onSync,
  isSyncing,
  syncError,
  onImportOpen,
  onExport,
  onLock,
}: VaultHeaderProps) {
  const router = useRouter();

  return (
    <header className="bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-neutral-800/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex justify-between items-center">
        {/* Brand & Sync Status */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Gupt Vault
          </h1>

          <div className="h-4 w-px bg-slate-200 dark:bg-neutral-800 mx-2 hidden sm:block" />

          <Button
            variant="ghost"
            size="icon"
            className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400 rounded-full hidden sm:inline-flex transition-colors"
            onClick={onSync}
            disabled={isSyncing}
            title="Sync Now"
          >
            <RefreshCw
              className={`w-4 h-4 ${isSyncing ? "animate-spin text-indigo-600 dark:text-indigo-400" : ""}`}
            />
          </Button>
          {syncError && (
            <span className="text-xs font-medium text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full">
              Sync failed
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex rounded-full font-medium shadow-sm hover:bg-slate-100 dark:hover:bg-neutral-800"
            onClick={onImportOpen}
            title="Import Backup"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex rounded-full font-medium shadow-sm hover:bg-slate-100 dark:hover:bg-neutral-800"
            onClick={onExport}
            title="Export Backup"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex rounded-full font-medium shadow-sm hover:bg-slate-100 dark:hover:bg-neutral-800"
            onClick={() => router.push("/app/settings")}
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full font-medium shadow-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-900/20 dark:hover:text-red-400 dark:hover:border-red-800/50 transition-colors"
            onClick={onLock}
          >
            <Lock className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Lock & Sign Out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
