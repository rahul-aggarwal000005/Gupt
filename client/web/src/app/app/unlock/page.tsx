"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

export default function UnlockVaultPage() {
  const router = useRouter();
  const [masterPassword, setMasterPassword] = useState("");
  const [showMasterPassword, setShowMasterPassword] = useState(false);
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
          <div className="w-12 h-12 border-4 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium animate-pulse">
            Loading encrypted vault...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-neutral-950 selection:bg-indigo-100 selection:text-indigo-900 p-4 sm:p-8">
      <div className="w-full max-w-7xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to home
        </Link>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="border-slate-200/50 dark:border-neutral-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] rounded-2xl bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl">
            <CardHeader className="space-y-2 pb-6 pt-8">
              <div className="flex items-center justify-center space-x-3 mb-2">
                <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Unlock Vault
                </CardTitle>
              </div>
              <CardDescription className="text-center text-slate-500">
                Enter your Master Password to decrypt your data
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6 pb-6">
                <div className="space-y-2.5 px-6">
                  <div className="flex justify-between items-center">
                    <Label
                      htmlFor="masterPassword"
                      className="text-slate-700 dark:text-slate-300"
                    >
                      Master Password
                    </Label>
                  </div>
                  <div className="relative">
                    <Input
                      id="masterPassword"
                      type={showMasterPassword ? "text" : "password"}
                      placeholder="Enter your Master Password"
                      value={masterPassword}
                      onChange={(e) => setMasterPassword(e.target.value)}
                      required
                      className="h-11 rounded-xl bg-white dark:bg-neutral-900 focus-visible:ring-indigo-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowMasterPassword(!showMasterPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                      {showMasterPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                {error && (
                  <p className="text-sm text-red-500 font-medium">{error}</p>
                )}
              </CardContent>
              <CardFooter className="flex flex-col space-y-4 pt-2 pb-8 px-8">
                <Button
                  className="w-full h-11 mx-6 rounded-xl font-medium shadow-sm hover:scale-[1.02] transition-transform duration-200"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? "Decrypting..." : "Unlock Vault"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
