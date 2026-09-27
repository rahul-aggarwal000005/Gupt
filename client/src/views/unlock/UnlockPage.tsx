"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CardContent, CardFooter } from "@/components/ui/card";
import {
  AuthCardWrapper,
  LoadingOverlay,
  PasswordInput,
} from "@/components/common";
import { useEncryptedVault, useUnlockVault } from "./hooks";
import { Lock } from "lucide-react";

export function UnlockPage() {
  const [masterPassword, setMasterPassword] = useState("");
  const { vaultData, isFetching } = useEncryptedVault();
  const { unlock, isUnlocking, error } = useUnlockVault(vaultData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await unlock(masterPassword);
  };

  const isLoading = isFetching || isUnlocking;

  if (isFetching || !vaultData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-neutral-950">
        <div className="flex flex-col items-center gap-4">
          <LoadingOverlay message="Loading encrypted vault..." />
        </div>
      </div>
    );
  }

  return (
    <AuthCardWrapper
      title="Unlock Vault"
      description="Enter your Master Password to decrypt your data"
      icon={<Lock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
      backHref="/"
      backLabel="Back to home"
      isLoading={isLoading}
      loadingMessage="Decrypting vault..."
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
            disabled={isUnlocking}
          >
            Unlock Vault
          </Button>
        </CardFooter>
      </form>
    </AuthCardWrapper>
  );
}
