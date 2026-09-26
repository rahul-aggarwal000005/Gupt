"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useVaultStore, VaultItem } from "@/lib/store";
import { logout } from "@/lib/auth";
import { exportVault } from "@/lib/export";
import { useAutoLock } from "@/hooks/useAutoLock";
import { ItemList } from "@/components/vault/ItemList";
import { ItemDialog } from "@/components/vault/ItemDialog";
import { ImportBackupDialog } from "@/components/vault/ImportBackupDialog";
import { SecurityAudit } from "@/components/vault/SecurityAudit";
import { VaultHeader } from "./components/VaultHeader";
import { VaultSidebar } from "./components/VaultSidebar";
import { VaultToolbar } from "./components/VaultToolbar";

export function VaultPage() {
  const router = useRouter();
  const {
    isUnlocked,
    vaultData,
    lockVault,
    isSyncing,
    syncError,
    syncVault,
    encryptionKey,
    salt,
  } = useVaultStore();

  const [activeTab, setActiveTab] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<VaultItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [importOpen, setImportOpen] = useState(false);

  // Initialize auto-lock (5 minutes)
  useAutoLock();

  useEffect(() => {
    if (!isUnlocked) {
      router.push("/app/unlock");
    }
  }, [isUnlocked, router]);

  const handleExport = async () => {
    if (!vaultData || !encryptionKey || !salt) {
      toast.error("Cannot export: Vault is locked or missing data");
      return;
    }
    try {
      await exportVault(vaultData, encryptionKey, salt);
      toast.success("Vault backup exported successfully");
    } catch {
      toast.error("Failed to export vault backup");
    }
  };

  if (!isUnlocked || !vaultData) {
    return null; // Will redirect to /app/unlock
  }

  const handleLock = async () => {
    lockVault();
    await logout();
    router.push("/");
  };

  const handleCreateNew = () => {
    setSelectedItem(null);
    setIsDialogOpen(true);
  };

  const handleEditItem = (item: VaultItem) => {
    setSelectedItem(item);
    setIsDialogOpen(true);
  };

  const items = vaultData.items || [];
  const logins = items.filter((item) => item.type === "login");
  const notes = items.filter((item) => item.type === "secure_note");

  const filterItems = (itemList: VaultItem[]) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return itemList;
    return itemList.filter((item) => item.title?.toLowerCase().includes(query));
  };

  const currentTabItems =
    activeTab === "all" ? items : activeTab === "logins" ? logins : notes;
  const filteredItems = filterItems(currentTabItems);

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
          totalCount={items.length}
          loginCount={logins.length}
          noteCount={notes.length}
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
            onCreateNew={handleCreateNew}
          />

          <div className="bg-transparent border-none shadow-none pt-2">
            <ItemList items={filteredItems} onEdit={handleEditItem} />
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
