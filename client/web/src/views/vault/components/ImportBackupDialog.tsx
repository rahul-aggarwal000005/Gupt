import { useState, useRef, useEffect } from "react";
import { useVaultStore } from "@/lib/store";
import { readAndDecryptBackupFile } from "@/lib/import";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  AlertTriangle,
  Loader2,
  GitMerge,
  Replace,
  CheckCircle2,
} from "lucide-react";

interface ImportBackupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportBackupDialog({
  open,
  onOpenChange,
}: ImportBackupDialogProps) {
  const { encryptionKey, importVaultBackup, isSyncing } = useVaultStore();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [isImporting, setIsImporting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset dialog state whenever it closes
  useEffect(() => {
    if (!open) {
      setSelectedFile(null);
      setImportMode("merge");
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".json") && file.type !== "application/json") {
        toast.error("Please select a valid JSON backup file");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error("Please choose a backup file to import");
      return;
    }

    if (!encryptionKey) {
      toast.error("Vault must be unlocked to import");
      return;
    }

    setIsImporting(true);

    try {
      const importedData = await readAndDecryptBackupFile(
        selectedFile,
        encryptionKey,
      );

      await importVaultBackup(importedData, importMode);

      toast.success(
        `Successfully imported backup (${importedData.items.length} item${
          importedData.items.length === 1 ? "" : "s"
        })`,
      );
      onOpenChange(false);
    } catch (error: any) {
      console.error("Import error:", error);
      toast.error(
        error?.message ||
          "Failed to import backup. Please check your file or master password.",
      );
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] rounded-2xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-slate-200/50 dark:border-neutral-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] p-6 sm:p-8">
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Import Encrypted Backup
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Select a{" "}
                <code className="bg-slate-100 dark:bg-neutral-800 px-1 py-0.5 rounded text-indigo-600 dark:text-indigo-400 font-mono">
                  gupt-vault-backup-*.json
                </code>{" "}
                file
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-3">
          {/* Hidden native file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleFileChange}
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
                  {(selectedFile.size / 1024).toFixed(1)} KB • Click to choose a different file
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

          {/* Strategy Option Cards */}
          <div className="space-y-2.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
              Import Strategy
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setImportMode("merge")}
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
                onClick={() => setImportMode("replace")}
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

        {/* Footer flush with card edges matching ItemDialog */}
        <DialogFooter className="pt-4 -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 px-6 sm:px-8 pb-6 sm:pb-8 rounded-b-2xl border-t border-slate-200/50 dark:border-neutral-800/50 bg-slate-50/50 dark:bg-neutral-900/50 gap-2 sm:gap-3 flex-col-reverse sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isImporting}
            className="h-11 rounded-xl min-w-[5rem] border-slate-200 dark:border-neutral-800"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={!selectedFile || isImporting || isSyncing}
            variant={importMode === "replace" ? "destructive" : "default"}
            className={`h-11 rounded-xl min-w-[7rem] font-medium shadow-sm ${
              importMode === "replace"
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
          >
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              "Import Vault"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
