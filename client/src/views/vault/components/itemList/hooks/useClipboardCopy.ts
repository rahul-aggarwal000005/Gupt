"use client";

import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";

const CLIPBOARD_CLEAR_DELAY = 30_000;

export function useClipboardCopy() {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const copyToClipboard = useCallback(
    async (text: string, label = "Password") => {
      try {
        await navigator.clipboard.writeText(text);

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        toast.success(`${label} copied`, {
          description: "Clipboard will clear in 30 seconds for security",
        });

        timeoutRef.current = setTimeout(async () => {
          try {
            await navigator.clipboard.writeText("");
            toast.info("Clipboard cleared for security");
          } catch {
            // Clipboard may be unavailable.
          } finally {
            timeoutRef.current = null;
          }
        }, CLIPBOARD_CLEAR_DELAY);
      } catch {
        toast.error(`Failed to copy ${label.toLowerCase()}`);
      }
    },
    [],
  );

  return { copyToClipboard };
}
