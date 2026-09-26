"use client";

import { useState } from "react";
import { VaultItem } from "@/lib/store";

export function useVaultDialogs() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<VaultItem | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const openCreateDialog = () => {
    setSelectedItem(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: VaultItem) => {
    setSelectedItem(item);
    setIsDialogOpen(true);
  };

  return {
    isDialogOpen,
    setIsDialogOpen,
    selectedItem,
    importOpen,
    setImportOpen,
    openCreateDialog,
    openEditDialog,
  };
}
