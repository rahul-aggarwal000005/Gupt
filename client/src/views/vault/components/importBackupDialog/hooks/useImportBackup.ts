"use client";

import { useState, useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useVaultStore } from "@/lib/store";
import { readAndDecryptBackupFile } from "@/lib/import";

export type ImportMode = "merge" | "replace";

interface UseImportBackupProps {
  onClose: () => void;
}

export function useImportBackup({ onClose }: UseImportBackupProps) {
  const { encryptionKey, importVaultBackup, isSyncing } = useVaultStore();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>("merge");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setSelectedFile(null);
    setImportMode("merge");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

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

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) {
        throw new Error("Please choose a backup file to import");
      }

      if (!encryptionKey) {
        throw new Error("Vault must be unlocked to import");
      }

      const importedData = await readAndDecryptBackupFile(
        selectedFile,
        encryptionKey,
      );

      await importVaultBackup(importedData, importMode);
      return importedData.items.length;
    },
    onSuccess: (count) => {
      toast.success(
        `Successfully imported backup (${count} item${count === 1 ? "" : "s"})`,
      );
      handleClose();
    },
    onError: (err: unknown) => {
      console.error("Import error:", err);
      toast.error(
        (err as Error)?.message ||
          "Failed to import backup. Please check your file or master password.",
      );
    },
  });

  return {
    selectedFile,
    importMode,
    setImportMode,
    isImporting: importMutation.isPending,
    isSyncing,
    fileInputRef,
    handleFileChange,
    handleClose,
    handleImport: () => importMutation.mutate(),
  };
}
