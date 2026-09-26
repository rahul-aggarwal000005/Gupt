"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { deriveKey, decryptVault, base64ToBuffer } from "@/lib/crypto";
import { useVaultStore, EncryptedVaultPayload } from "@/lib/store";

interface EncryptedVaultData {
  version: number;
  encryptedData: string;
}

export function useUnlockVault(
  vaultData: EncryptedVaultData | null | undefined,
) {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const unlockVault = useVaultStore((state) => state.unlockVault);

  const mutation = useMutation({
    mutationFn: async (masterPassword: string) => {
      if (!vaultData) {
        throw new Error("Encrypted vault data not available");
      }

      if (!masterPassword) {
        throw new Error("Master password is required");
      }

      const payload: EncryptedVaultPayload = JSON.parse(
        vaultData.encryptedData,
      );

      const salt = base64ToBuffer(payload.salt);
      const iv = base64ToBuffer(payload.iv);
      const ciphertext = base64ToBuffer(payload.ciphertext);

      // 1. Derive encryption key using master password and salt
      const key = await deriveKey(masterPassword, salt);

      // 2. Decrypt encrypted vault ciphertext
      const plaintext = await decryptVault(ciphertext, key, iv);
      const decryptedData = JSON.parse(plaintext);

      // 3. Store derived key and decrypted vault in memory
      unlockVault(key, decryptedData, vaultData.version, payload.salt);

      return true;
    },
    onMutate: () => {
      setError("");
    },
    onSuccess: () => {
      router.replace("/app/vault");
    },
    onError: (err: unknown) => {
      console.error("Unlock error:", err);
      setError("Invalid Master Password");
    },
  });

  return {
    unlock: mutation.mutateAsync,
    isUnlocking: mutation.isPending,
    error,
    setError,
  };
}
