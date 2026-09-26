"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useVaultStore } from "@/lib/store";
import { exportVault } from "@/lib/export";
import { useLogout } from "@/hooks/useLogout";

export function useVaultActions() {
  const router = useRouter();
  const [isLocking, setIsLocking] = useState(false);
  const { lockVault, vaultData, encryptionKey, salt } = useVaultStore();
  const { logout, isLoggingOut } = useLogout();

  const handleLock = async () => {
    setIsLocking(true);
    try {
      await logout();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      lockVault();
      router.replace("/");
    }
  };

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

  return {
    handleLock,
    handleExport,
    isLocking: isLocking || isLoggingOut,
  };
}
