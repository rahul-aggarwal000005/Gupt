"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useVaultStore } from "@/lib/store";
import { useAutoLock } from "@/hooks/useAutoLock";
import { ItemList } from "@/components/vault/ItemList";
import { ItemDialog } from "@/components/vault/ItemDialog";
import { ImportBackupDialog } from "@/components/vault/ImportBackupDialog";
import { SecurityAudit } from "@/components/vault/SecurityAudit";
import { VaultHeader } from "./components/VaultHeader";
import { VaultSidebar } from "./components/VaultSidebar";
import { VaultToolbar } from "./components/VaultToolbar";
import { useVaultItems, useVaultActions, useVaultDialogs } from "./hooks";
import { LoadingOverlay } from "@/components/common";

export function VaultPage() {
  const router = useRouter();
  const { isUnlocked, vaultData, isSyncing, syncError, syncVault } =
    useVaultStore();

  // Initialize auto-lock (5 minutes)
  useAutoLock();
  const { handleLock, handleExport, isLocking } = useVaultActions();

  useEffect(() => {
    if (isLocking) {
      return;
    }

    if (!isUnlocked) {
      router.replace("/app/unlock");
    }
  }, [isUnlocked, router, isLocking]);

  const {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    filteredItems,
    counts,
  } = useVaultItems(vaultData);

  const {
    isDialogOpen,
    setIsDialogOpen,
    selectedItem,
    importOpen,
    setImportOpen,
    openCreateDialog,
    openEditDialog,
  } = useVaultDialogs();

  if (isLocking) {
    return (
      <div className="min-h-screen relative flex items-center justify-center bg-slate-50 dark:bg-neutral-950">
        <LoadingOverlay message="Locking vault and signing out..." />
      </div>
    );
  }

  if (!isUnlocked || !vaultData) {
    return null; // Will redirect to /app/unlock
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-neutral-950 selection:bg-indigo-100 selection:text-indigo-900">
      <VaultHeader
        onSync={() => syncVault()}
        isSyncing={isSyncing}
        syncError={syncError}
        onImportOpen={() => setImportOpen(true)}
        onExport={handleExport}
        onLock={handleLock}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col md:flex-row gap-8">
        <VaultSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          totalCount={counts.total}
          loginCount={counts.logins}
          noteCount={counts.notes}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex-1 space-y-6"
        >
          <SecurityAudit />

          <VaultToolbar
            title={activeTab}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onCreateNew={openCreateDialog}
          />

          <div className="bg-transparent border-none shadow-none pt-2">
            <ItemList items={filteredItems} onEdit={openEditDialog} />
          </div>
        </motion.div>
      </main>

      <ItemDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        item={selectedItem}
      />
      <ImportBackupDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}
