"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { deriveKey, decryptVault, base64ToBuffer } from "@/lib/crypto";
import { getVault } from "@/lib/auth";
import { useVaultStore, EncryptedVaultPayload } from "@/lib/store";

export default function UnlockVaultPage() {
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
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <p className="text-neutral-500 animate-pulse">Loading vault...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Unlock Vault
          </CardTitle>
          <CardDescription className="text-center">
            Enter your Master Password to decrypt your data
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="masterPassword">Master Password</Label>
              <Input
                id="masterPassword"
                type="password"
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                required
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? "Decrypting..." : "Unlock"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
