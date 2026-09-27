"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { VaultItem, VaultItemType, useVaultStore } from "@/lib/store";
import { generatePassword } from "@/lib/password";

interface UseItemFormProps {
  item: VaultItem | null;
  onSuccess: () => void;
}

export function useItemForm({ item, onSuccess }: UseItemFormProps) {
  const { addItem, updateItem } = useVaultStore();

  const [type, setType] = useState<VaultItemType>(item?.type ?? "login");
  const [title, setTitle] = useState(item?.title ?? "");
  const [username, setUsername] = useState(
    item?.type === "login" ? item.username || "" : "",
  );
  const [password, setPassword] = useState(
    item?.type === "login" ? item.password || "" : "",
  );
  const [url, setUrl] = useState(item?.type === "login" ? item.url || "" : "");
  const [notes, setNotes] = useState(
    item?.type === "login" ? item.notes || "" : "",
  );
  const [content, setContent] = useState(
    item?.type === "secure_note" ? item.content || "" : "",
  );
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleGeneratePassword = () => {
    const newPassword = generatePassword({
      length: 16,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
    });
    setPassword(newPassword);
    setShowPassword(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    setIsSaving(true);

    try {
      const baseData = {
        title,
        updatedAt: new Date().toISOString(),
      };

      if (item) {
        // Update existing item
        if (type === "login") {
          await updateItem(item.id, {
            ...item,
            ...baseData,
            type: "login",
            username,
            password,
            url,
            notes,
          });
        } else {
          await updateItem(item.id, {
            ...item,
            ...baseData,
            type: "secure_note",
            content,
          });
        }
      } else {
        // Create new item
        const id = uuidv4();
        const createdAt = new Date().toISOString();

        if (type === "login") {
          await addItem({
            id,
            createdAt,
            ...baseData,
            type: "login",
            username,
            password,
            url,
            notes,
          });
        } else {
          await addItem({
            id,
            createdAt,
            ...baseData,
            type: "secure_note",
            content,
          });
        }
      }

      onSuccess();
    } catch (error) {
      console.error("Failed to save item:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    type,
    setType,
    title,
    setTitle,
    username,
    setUsername,
    password,
    setPassword,
    url,
    setUrl,
    notes,
    setNotes,
    content,
    setContent,
    showPassword,
    setShowPassword,
    isSaving,
    handleGeneratePassword,
    handleSubmit,
  };
}
