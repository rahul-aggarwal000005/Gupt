import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useImportBackup } from "./hooks/useImportBackup";
import { BackupFileDropzone, ImportStrategySelector } from "./components";

interface ImportBackupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportBackupDialog({
  open,
  onOpenChange,
}: ImportBackupDialogProps) {
  const {
    selectedFile,
    importMode,
    setImportMode,
    isImporting,
    isSyncing,
    fileInputRef,
    handleFileChange,
    handleClose,
    handleImport,
  } = useImportBackup({
    onClose: () => onOpenChange(false),
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      handleClose();
    } else {
      onOpenChange(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
          <BackupFileDropzone
            selectedFile={selectedFile}
            fileInputRef={fileInputRef}
            onFileSelect={handleFileChange}
          />

          <ImportStrategySelector
            importMode={importMode}
            onStrategyChange={setImportMode}
          />
        </div>

        {/* Footer flush with card edges matching ItemDialog */}
        <DialogFooter className="pt-4 -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 px-6 sm:px-8 pb-6 sm:pb-8 rounded-b-2xl border-t border-slate-200/50 dark:border-neutral-800/50 bg-slate-50/50 dark:bg-neutral-900/50 gap-2 sm:gap-3 flex-col-reverse sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
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
            isLoading={isImporting}
          >
            {isImporting ? "Importing..." : "Import Vault"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
