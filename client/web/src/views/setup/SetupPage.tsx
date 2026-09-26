"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CardContent, CardFooter } from "@/components/ui/card";
import {
  AuthCardWrapper,
  PasswordInput,
  LoadingSpinner,
} from "@/components/common";
import {
  deriveKey,
  encryptVault,
  generateIV,
  generateSalt,
  bufferToBase64,
} from "@/lib/crypto";
import { updateVault } from "@/lib/auth";
import { useVaultStore, EncryptedVaultPayload, VaultData } from "@/lib/store";
import { Key } from "lucide-react";

export function SetupPage() {
  const router = useRouter();
  const [masterPassword, setMasterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const unlockVault = useVaultStore((state) => state.unlockVault);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (masterPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (masterPassword.length < 12) {
      setError("Master Password must be at least 12 characters long");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Generate salt and IV
      const salt = generateSalt();
      const iv = generateIV();

      // 2. Derive key
      const key = await deriveKey(masterPassword, salt);

      // 3. Create initial empty vault
      const initialVaultData: VaultData = { items: [] };
      const plaintext = JSON.stringify(initialVaultData);

      // 4. Encrypt vault
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

      // 7. Store in memory and redirect
      unlockVault(key, initialVaultData, response.version, payload.salt);
      router.push("/app/vault");
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      console.error(err);
      setError(error.response?.data?.error || "Failed to setup vault");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCardWrapper
      title="Setup Master Password"
      description="This password encrypts your vault. If you lose it, your data cannot be recovered."
      icon={<Key className="w-5 h-5" />}
      backHref="/"
      backLabel="Back to home"
    >
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6 pb-6 px-6 sm:px-8">
          <div className="space-y-2.5">
            <Label
              htmlFor="masterPassword"
              className="text-slate-700 dark:text-slate-300"
            >
              Master Password
            </Label>
            <PasswordInput
              id="masterPassword"
              placeholder="Enter your Master Password"
              value={masterPassword}
              onChange={(e) => setMasterPassword(e.target.value)}
              required
              minLength={12}
            />
          </div>
          <div className="space-y-2.5">
            <Label
              htmlFor="confirmPassword"
              className="text-slate-700 dark:text-slate-300"
            >
              Confirm Master Password
            </Label>
            <PasswordInput
              id="confirmPassword"
              placeholder="Confirm Master Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={12}
            />
            <p className="text-xs text-slate-500 mt-1.5">
              Must be at least 12 characters long.
            </p>
          </div>
          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-2 pb-8 px-6 sm:px-8">
          <Button
            className="w-full h-11 rounded-xl font-medium shadow-sm hover:scale-[1.02] transition-transform duration-200"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <LoadingSpinner size="sm" label="Creating Vault..." />
            ) : (
              "Create Vault"
            )}
          </Button>
        </CardFooter>
      </form>
    </AuthCardWrapper>
  );
}
