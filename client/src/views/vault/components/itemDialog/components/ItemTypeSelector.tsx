"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { VaultItemType } from "@/lib/store";

interface ItemTypeSelectorProps {
  type: VaultItemType;
  onTypeChange: (type: VaultItemType) => void;
}

export function ItemTypeSelector({
  type,
  onTypeChange,
}: ItemTypeSelectorProps) {
  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant={type === "login" ? "default" : "outline"}
        onClick={() => onTypeChange("login")}
        className="flex-1 h-11 rounded-xl"
      >
        Login
      </Button>
      <Button
        type="button"
        variant={type === "secure_note" ? "default" : "outline"}
        onClick={() => onTypeChange("secure_note")}
        className="flex-1 h-11 rounded-xl"
      >
        Secure Note
      </Button>
    </div>
  );
}
