"use client";

import { useState } from "react";
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
import {
  deriveKey,
  encryptVault,
  generateIV,
  generateSalt,
  bufferToBase64,
} from "@/lib/crypto";
import { updateVault } from "@/lib/auth";
import { useVaultStore, EncryptedVaultPayload, VaultData } from "@/lib/store";
import { Key, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function SetupVaultPage() {
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
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Setup Master Password
                </CardTitle>
              </div>
              <CardDescription className="text-center text-red-500 font-medium px-4">
                This password encrypts your vault. If you lose it, your data cannot be recovered.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6 pb-6">
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <Label
                      htmlFor="masterPassword"
                      className="text-slate-700 dark:text-slate-300"
                    >
                      Master Password
                    </Label>
                  </div>
                  <Input
                    id="masterPassword"
                    type="password"
                    value={masterPassword}
                    onChange={(e) => setMasterPassword(e.target.value)}
                    required
                    minLength={12}
                    className="h-11 rounded-xl bg-white dark:bg-neutral-900 focus-visible:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <Label
                      htmlFor="confirmPassword"
                      className="text-slate-700 dark:text-slate-300"
                    >
                      Confirm Master Password
                    </Label>
                  </div>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={12}
                    className="h-11 rounded-xl bg-white dark:bg-neutral-900 focus-visible:ring-indigo-500"
                  />
                  <p className="text-xs text-slate-500 mt-1.5">
                    Must be at least 12 characters long.
                  </p>
                </div>
                {error && (
                  <p className="text-sm text-red-500 font-medium">{error}</p>
                )}
              </CardContent>
              <CardFooter className="flex flex-col space-y-4 pt-2 pb-8">
                <Button
                  className="w-full h-11 rounded-xl font-medium shadow-sm hover:scale-[1.02] transition-transform duration-200"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Vault..." : "Create Vault"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
