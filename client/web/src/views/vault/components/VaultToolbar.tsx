"use client";

import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";

export interface VaultToolbarProps {
  title: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCreateNew: () => void;
}

export function VaultToolbar({
  title,
  searchQuery,
  onSearchChange,
  onCreateNew,
}: VaultToolbarProps) {
  return (
    <div className="flex justify-between items-center pt-6">
      <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white capitalize">
        {title}
      </h2>
      <div className="relative w-full max-w-sm hidden md:block mx-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search vault..."
          className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
        />
      </div>
      <Button
        onClick={onCreateNew}
        className="h-10 rounded-xl font-medium shadow-sm hover:scale-[1.02] transition-transform duration-200 shrink-0"
      >
        <Plus className="w-4 h-4 mr-2" />
        New Item
      </Button>
    </div>
  );
}
