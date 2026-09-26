"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CardContent, CardFooter } from "@/components/ui/card";
import {
  AuthCardWrapper,
  PasswordInput,
  LoadingSpinner,
} from "@/components/common";
import { deriveKey, decryptVault, base64ToBuffer } from "@/lib/crypto";
import { getVault } from "@/lib/auth";
import { useVaultStore, EncryptedVaultPayload } from "@/lib/store";
import { Lock } from "lucide-react";

export function UnlockPage() {
  const router = useRouter();
  const [masterPassword, setMasterPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [vaultData, setVaultData] = useState<{
    version: number;
    encryptedData: string;
  } | null>(null);
  const unlockVault = useVaultStore((state) => state.unlockVault);

  useEffect(() => {
    const fetchVault = async () => {
      try {
        const data = await getVault();
        if (!data) {
          // No vault exists, redirect to setup
          router.push("/app/setup");
        } else {
          setVaultData(data);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to fetch vault from server");
      } finally {
        setIsFetching(false);
      }
    };

    fetchVault();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vaultData) return;

    setError("");
    setIsLoading(true);

    try {
      const payload: EncryptedVaultPayload = JSON.parse(
        vaultData.encryptedData,
      );

      const salt = base64ToBuffer(payload.salt);
      const iv = base64ToBuffer(payload.iv);
      const ciphertext = base64ToBuffer(payload.ciphertext);

      // 1. Derive key
      const key = await deriveKey(masterPassword, salt);

      // 2. Decrypt vault
      const plaintext = await decryptVault(ciphertext, key, iv);
      const decryptedData = JSON.parse(plaintext);

      // 3. Store in memory and redirect
      unlockVault(key, decryptedData, vaultData.version, payload.salt);
      router.push("/app/vault");
    } catch (err) {
      console.error(err);
      setError("Invalid Master Password");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-neutral-950">
        <div className="flex flex-col items-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-slate-500 font-medium animate-pulse">
            Loading encrypted vault...
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthCardWrapper
      title="Unlock Vault"
      description="Enter your Master Password to decrypt your data"
      icon={<Lock className="w-5 h-5" />}
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
            />
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
              <LoadingSpinner size="sm" label="Decrypting..." />
            ) : (
              "Unlock Vault"
            )}
          </Button>
        </CardFooter>
      </form>
    </AuthCardWrapper>
  );
}
