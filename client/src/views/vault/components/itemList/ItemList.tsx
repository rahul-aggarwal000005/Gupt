"use client";

import { VaultItem } from "@/lib/store";
import { EmptyState } from "@/components/common";
import { VaultCard } from "./components";
import { useClipboardCopy } from "./hooks";

interface ItemListProps {
  items: VaultItem[];
  onEdit: (item: VaultItem) => void;
}

export function ItemList({ items, onEdit }: ItemListProps) {
  const { copyToClipboard } = useClipboardCopy();

  if (items.length === 0) {
    return (
      <EmptyState
        title="No items found"
        description="There are no items matching this category or search query."
        className="my-6 border-none"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <VaultCard
          key={item.id}
          item={item}
          onEdit={onEdit}
          onCopyPassword={copyToClipboard}
        />
      ))}
    </div>
  );
}
