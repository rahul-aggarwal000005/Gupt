"use client";

import { VaultItem, useVaultStore } from "@/lib/store";
import { FileText, Copy, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hostnameFromUrl } from "@/lib/favicon";
import { LoginItemIcon } from "./LoginItemIcon";

interface VaultCardProps {
  item: VaultItem;
  onEdit: (item: VaultItem) => void;
  onCopyPassword: (password: string) => void;
}

export function VaultCard({ item, onEdit, onCopyPassword }: VaultCardProps) {
  const deleteItem = useVaultStore((state) => state.deleteItem);

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this item?")) {
      deleteItem(item.id);
    }
  };

  return (
    <div className="group relative flex flex-col p-5 bg-white/50 dark:bg-neutral-900/50 border border-slate-200/60 dark:border-neutral-800/60 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] dark:shadow-[0_2px_10px_rgb(0,0,0,0.08)] hover:shadow-md hover:border-slate-300 dark:hover:border-neutral-700 transition-all duration-200 h-[200px]">
      {/* Top Row: Icon & Actions */}
      <div className="flex items-start justify-between mb-4">
        {item.type === "login" ? (
          <LoginItemIcon
            key={`${item.id}-${hostnameFromUrl(item.url) ?? "no-url"}`}
            url={item.url}
          />
        ) : (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-100 bg-amber-50/50 text-amber-600 shadow-sm dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-400">
            <FileText className="h-5 w-5" />
          </div>
        )}

        <div className="flex items-center space-x-1 focus-within:opacity-100 transition-opacity">
          {item.type === "login" && item.password && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400"
              onClick={() => onCopyPassword(item.password!)}
              title="Copy Password"
            >
              <Copy className="w-4 h-4" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-neutral-800"
            onClick={() => onEdit(item)}
            title="Edit Item"
          >
            <Edit className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20"
            onClick={handleDelete}
            title="Delete Item"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Bottom Row: Title & Details */}
      <div className="flex-1 flex flex-col justify-end overflow-hidden">
        <h3 className="font-semibold text-slate-900 dark:text-white truncate tracking-tight text-lg mb-0.5">
          {item.title}
        </h3>
        {item.type === "login" && item.username ? (
          <p className="text-sm text-slate-500 truncate">{item.username}</p>
        ) : (
          <p className="text-sm text-slate-400 dark:text-slate-500 truncate italic">
            Secure Note
          </p>
        )}
      </div>
    </div>
  );
}
