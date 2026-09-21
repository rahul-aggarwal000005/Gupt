'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useVaultStore, VaultItem } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Lock, Plus, Key, FileText, Loader2, RefreshCw, Download, Settings } from 'lucide-react';
import { logout } from '@/lib/auth';
import { exportVault } from '@/lib/export';
import { toast } from 'sonner';
import { ItemList } from '@/components/vault/ItemList';
import { ItemDialog } from '@/components/vault/ItemDialog';
import { SecurityAudit } from '@/components/vault/SecurityAudit';
import { useAutoLock } from '@/hooks/useAutoLock';

export default function VaultDashboard() {
  const router = useRouter();
  const { isUnlocked, vaultData, lockVault, isSyncing, syncError, syncVault, encryptionKey, salt } = useVaultStore();
  const [activeTab, setActiveTab] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<VaultItem | null>(null);

  // Initialize auto-lock (5 minutes)
  useAutoLock();

  useEffect(() => {
    if (!isUnlocked) {
      router.push('/app/unlock');
    }
  }, [isUnlocked, router]);

  const handleExport = async () => {
    if (!vaultData || !encryptionKey || !salt) {
      toast.error('Cannot export: Vault is locked or missing data');
      return;
    }
    try {
      await exportVault(vaultData, encryptionKey, salt);
      toast.success('Vault backup exported successfully');
    } catch (error) {
      toast.error('Failed to export vault backup');
    }
  };

  if (!isUnlocked || !vaultData) {
    return null; // Will redirect
  }

  const handleLock = async () => {
    lockVault();
    await logout();
    router.push('/');
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
  const logins = items.filter((item) => item.type === 'login');
  const notes = items.filter((item) => item.type === 'secure_note');

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Header */}
      <header className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 p-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">Gupt Vault</h1>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => syncVault()} 
              disabled={isSyncing}
              title="Sync Now"
            >
              <RefreshCw className={`w-4 h-4 text-neutral-500 ${isSyncing ? 'animate-spin' : ''}`} />
            </Button>
            {syncError && (
              <span className="text-xs text-red-500">Sync failed</span>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExport}
              title="Export Backup"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push('/app/settings')}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" size="sm" onClick={handleLock}>
              <Lock className="w-4 h-4 mr-2" />
              Lock & Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-4 md:p-8 flex flex-col md:flex-row gap-8">
        {/* Sidebar / Tabs */}
        <div className="w-full md:w-64 shrink-0">
          <Card>
            <CardContent className="p-2">
              <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="w-full">
                <TabsList className="flex flex-col h-auto bg-transparent space-y-1">
                  <TabsTrigger value="all" className="w-full justify-start data-[state=active]:bg-neutral-100 dark:data-[state=active]:bg-neutral-800">
                    All Items ({items.length})
                  </TabsTrigger>
                  <TabsTrigger value="logins" className="w-full justify-start data-[state=active]:bg-neutral-100 dark:data-[state=active]:bg-neutral-800">
                    <Key className="w-4 h-4 mr-2" /> Logins ({logins.length})
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="w-full justify-start data-[state=active]:bg-neutral-100 dark:data-[state=active]:bg-neutral-800">
                    <FileText className="w-4 h-4 mr-2" /> Secure Notes ({notes.length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* List Area */}
        <div className="flex-1 space-y-4">
          <SecurityAudit />
          
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold capitalize">{activeTab}</h2>
            <Button onClick={handleCreateNew}>
              <Plus className="w-4 h-4 mr-2" />
              New Item
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {activeTab === 'all' && <ItemList items={items} onEdit={handleEditItem} />}
              {activeTab === 'logins' && <ItemList items={logins} onEdit={handleEditItem} />}
              {activeTab === 'notes' && <ItemList items={notes} onEdit={handleEditItem} />}
            </CardContent>
          </Card>
        </div>
      </main>

      <ItemDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        item={selectedItem} 
      />
    </div>
  );
}