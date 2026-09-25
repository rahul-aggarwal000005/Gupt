"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useVaultStore, VaultItem } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Lock,
  Plus,
  Key,
  FileText,
  RefreshCw,
  Download,
  Settings,
  Shield,
  Search,
  Upload,
} from "lucide-react";
import { logout } from "@/lib/auth";
import { exportVault } from "@/lib/export";
import { toast } from "sonner";
import { ItemList } from "@/components/vault/ItemList";
import { ItemDialog } from "@/components/vault/ItemDialog";
import { ImportBackupDialog } from "@/components/vault/ImportBackupDialog";
import { SecurityAudit } from "@/components/vault/SecurityAudit";
import { useAutoLock } from "@/hooks/useAutoLock";
import { motion } from "framer-motion";

export default function VaultDashboard() {
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
    } catch (error) {
      toast.error("Failed to export vault backup");
    }
  };

  if (!isUnlocked || !vaultData) {
    return null; // Will redirect
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

  const filterItems = (items: VaultItem[]) => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return items;
    }

    return items.filter((item) => {
      return item.title?.toLowerCase().includes(query);
    });
  };

  const filteredItems = filterItems(
    activeTab === "all" ? items : activeTab === "logins" ? logins : notes,
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-neutral-950 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Header */}
      <header className="bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-neutral-800/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Gupt Vault
            </h1>

            <div className="h-4 w-px bg-slate-200 dark:bg-neutral-800 mx-2 hidden sm:block"></div>

            <Button
              variant="ghost"
              size="icon"
              className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400 rounded-full hidden sm:inline-flex transition-colors"
              onClick={() => syncVault()}
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
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex rounded-full font-medium shadow-sm hover:bg-slate-100 dark:hover:bg-neutral-800"
              onClick={() => setImportOpen(true)}
              title="Import Backup"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex rounded-full font-medium shadow-sm hover:bg-slate-100 dark:hover:bg-neutral-800"
              onClick={handleExport}
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
              onClick={handleLock}
            >
              <Lock className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Lock & Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col md:flex-row gap-8">
        {/* Sidebar / Tabs */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full md:w-64 shrink-0"
        >
          <Card className="border-slate-200/50 dark:border-neutral-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] rounded-2xl bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl">
            <CardContent className="p-3">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                orientation="vertical"
                className="w-full"
              >
                <TabsList className="flex flex-col h-auto bg-transparent space-y-1 p-0">
                  <TabsTrigger
                    value="all"
                    className="w-full justify-start rounded-xl px-3 py-2 text-sm font-medium data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600 dark:data-[state=active]:bg-indigo-900/30 dark:data-[state=active]:text-indigo-400 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    All Items ({items.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="logins"
                    className="w-full justify-start rounded-xl px-3 py-2 text-sm font-medium data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600 dark:data-[state=active]:bg-indigo-900/30 dark:data-[state=active]:text-indigo-400 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <Key className="w-4 h-4 mr-2" /> Logins ({logins.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="notes"
                    className="w-full justify-start rounded-xl px-3 py-2 text-sm font-medium data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600 dark:data-[state=active]:bg-indigo-900/30 dark:data-[state=active]:text-indigo-400 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <FileText className="w-4 h-4 mr-2" /> Secure Notes (
                    {notes.length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>

        {/* List Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex-1 space-y-6"
        >
          <SecurityAudit />

          <div className="flex justify-between items-center pt-6">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white capitalize">
              {activeTab}
            </h2>
            <div className="relative w-full max-w-sm hidden md:block mx-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vault..."
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
              />
            </div>
            <Button
              onClick={handleCreateNew}
              className="h-10 rounded-xl font-medium shadow-sm hover:scale-[1.02] transition-transform duration-200 shrink-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Item
            </Button>
          </div>

          <div className="bg-transparent border-none shadow-none pt-2">
            <div>
              <ItemList items={filteredItems} onEdit={handleEditItem} />
            </div>
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
