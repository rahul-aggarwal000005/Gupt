"use client";

import { useState, useMemo } from "react";
import { VaultData } from "@/lib/store";

export type VaultTab = "all" | "logins" | "notes";

export function useVaultItems(vaultData: VaultData | null) {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const items = useMemo(() => vaultData?.items || [], [vaultData]);
  const logins = useMemo(
    () => items.filter((item) => item.type === "login"),
    [items],
  );
  const notes = useMemo(
    () => items.filter((item) => item.type === "secure_note"),
    [items],
  );

  const filteredItems = useMemo(() => {
    let currentTabItems = items;

    if (activeTab === "logins") {
      currentTabItems = logins;
    } else if (activeTab === "notes") {
      currentTabItems = notes;
    }

    const query = searchQuery.trim().toLowerCase();
    if (!query) return currentTabItems;

    return currentTabItems.filter((item) =>
      item.title?.toLowerCase().includes(query),
    );
  }, [items, logins, notes, activeTab, searchQuery]);

  return {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    filteredItems,
    counts: {
      total: items.length,
      logins: logins.length,
      notes: notes.length,
    },
  };
}
