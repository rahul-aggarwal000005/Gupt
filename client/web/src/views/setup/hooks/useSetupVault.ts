"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  deriveKey,
  encryptVault,
  generateIV,
  generateSalt,
  bufferToBase64,
} from "@/lib/crypto";
import { updateVault } from "@/lib/auth";
import { useVaultStore, EncryptedVaultPayload, VaultData } from "@/lib/store";

export function useSetupVault() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string>("");
  const unlockVault = useVaultStore((state) => state.unlockVault);

  const mutation = useMutation({
    mutationFn: async (masterPassword: string) => {
      // 1. Generate salt and IV
      const salt = generateSalt();
      const iv = generateIV();

      // 2. Derive key (Argon2id / PBKDF2)
      const key = await deriveKey(masterPassword, salt);

      // 3. Create initial empty vault
      const initialVaultData: VaultData = { items: [] };
      const plaintext = JSON.stringify(initialVaultData);

      // 4. Encrypt initial vault
      const ciphertext = await encryptVault(plaintext, key, iv);

      // 5. Construct payload
      const payload: EncryptedVaultPayload = {
        algorithm: "AES-256-GCM",
        kdf: "Argon2id",
        salt: bufferToBase64(salt),
        iv: bufferToBase64(iv),
        ciphertext: bufferToBase64(ciphertext),
      };

      // 6. Send to server (version 1)
      const response = await updateVault(1, JSON.stringify(payload));

      // 7. Store in memory and invalidate query cache
      unlockVault(key, initialVaultData, response.version, payload.salt);
      queryClient.invalidateQueries({ queryKey: ["vault"] });

      return response;
    },
    onMutate: () => {
      setError("");
    },
    onSuccess: () => {
      router.replace("/app/vault");
    },
    onError: (err: unknown) => {
      const errorObj = err as { response?: { data?: { error?: string } } };
      console.error("Setup vault error:", err);
      setError(errorObj.response?.data?.error || "Failed to setup vault");
    },
  });

  return {
    setupVault: mutation.mutateAsync,
    isSettingUp: mutation.isPending,
    error,
    setError,
  };
}
