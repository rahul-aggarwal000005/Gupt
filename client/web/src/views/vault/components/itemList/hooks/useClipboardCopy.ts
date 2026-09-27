"use client";

import { useCallback } from "react";
import { toast } from "sonner";

export function useClipboardCopy() {
  const copyToClipboard = useCallback(async (text: string, label: string = "Password") => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`, {
        description: "Clipboard will clear in 30 seconds for security",
      });

      // Clear clipboard after 30 seconds
      setTimeout(async () => {
        try {
          const currentClipboard = await navigator.clipboard.readText();
          if (currentClipboard === text) {
            await navigator.clipboard.writeText("");
            toast.info("Clipboard cleared for security");
          }
        } catch {
          // Clipboard read may fail if browser tab loses focus, which is expected
        }
      }, 30000);
    } catch {
      toast.error(`Failed to copy ${label.toLowerCase()}`);
    }
  }, []);

  return { copyToClipboard };
}
