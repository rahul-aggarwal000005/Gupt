"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CardContent, CardFooter } from "@/components/ui/card";
import { AuthCardWrapper, PasswordInput } from "@/components/common";
import { useSetupVault } from "./hooks";
import { Key } from "lucide-react";

export function SetupPage() {
  const [masterPassword, setMasterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { setupVault, isSettingUp, error, setError } = useSetupVault();

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

    await setupVault(masterPassword);
  };

  return (
    <AuthCardWrapper
      title="Setup Master Password"
      description="This password encrypts your vault. If you lose it, your data cannot be recovered."
      icon={<Key className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
      backHref="/"
      backLabel="Back to home"
      isLoading={isSettingUp}
      loadingMessage="Creating and encrypting vault..."
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
            disabled={isSettingUp}
          >
            Create Vault
          </Button>
        </CardFooter>
      </form>
    </AuthCardWrapper>
  );
}
