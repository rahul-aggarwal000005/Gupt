"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useVaultStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common";
import { ArrowLeft, Fingerprint } from "lucide-react";
import {
  registerPasskey,
  listPasskeys,
  deletePasskey,
  PasskeySummary,
} from "@/lib/webauthn";
import { toast } from "sonner";
import { PasskeyList } from "./components/PasskeyList";
import { DeletePasskeyDialog } from "./components/DeletePasskeyDialog";

export function SettingsPage() {
  const router = useRouter();
  const { isUnlocked } = useVaultStore();
  const [isRegistering, setIsRegistering] = useState(false);
  const [passkeys, setPasskeys] = useState<PasskeySummary[]>([]);
  const [isLoadingPasskeys, setIsLoadingPasskeys] = useState(true);
  const [passkeyToDelete, setPasskeyToDelete] = useState<PasskeySummary | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPasskeys = useCallback(async () => {
    setIsLoadingPasskeys(true);
    try {
      const data = await listPasskeys();
      setPasskeys(data);
    } catch (error: unknown) {
      console.error("Failed to load passkeys:", error);
      const message =
        (error as { response?: { data?: { error?: string } } }).response?.data
          ?.error || "Failed to load passkeys.";
      toast.error(message);
    } finally {
      setIsLoadingPasskeys(false);
    }
  }, []);

  useEffect(() => {
    if (!isUnlocked) {
      router.push("/app/unlock");
      return;
    }

    let ignore = false;

    listPasskeys()
      .then((data) => {
        if (!ignore) setPasskeys(data);
      })
      .catch((error: unknown) => {
        if (!ignore) {
          console.error("Failed to load passkeys:", error);
          const message =
            (error as { response?: { data?: { error?: string } } }).response
              ?.data?.error || "Failed to load passkeys.";
          toast.error(message);
        }
      })
      .finally(() => {
        if (!ignore) setIsLoadingPasskeys(false);
      });

    return () => {
      ignore = true;
    };
  }, [isUnlocked, router]);

  const handleRegisterPasskey = async () => {
    setIsRegistering(true);
    try {
      const success = await registerPasskey();
      if (success) {
        toast.success(
          "Passkey registered successfully! You can now use it to log in.",
        );
        await fetchPasskeys();
      } else {
        toast.error("Failed to register passkey.");
      }
    } catch (error: unknown) {
      console.error(error);
      const message =
        (error as { response?: { data?: { error?: string } } }).response?.data
          ?.error ||
          (error as Error).message ||
          "An error occurred during passkey registration.";
      toast.error(message);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleDeletePasskey = async () => {
    if (!passkeyToDelete) return;
    setIsDeleting(true);
    try {
      await deletePasskey(passkeyToDelete.id);
      toast.success("Passkey removed successfully.");
      setPasskeyToDelete(null);
      await fetchPasskeys();
    } catch (error: unknown) {
      console.error(error);
      const message =
        (error as { response?: { data?: { error?: string } } }).response?.data
          ?.error ||
          (error as Error).message ||
          "Failed to remove passkey.";
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isUnlocked) return null;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <header className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/app/vault")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Biometrics & Passkeys</CardTitle>
            <CardDescription>
              Register a passkey (Touch ID, Face ID, Windows Hello, or a
              security key) to log in without a password. Note: You will still
              need your Master Password to decrypt your vault.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  Registered Passkeys
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Passkeys currently linked to your account for fast, secure
                  sign-in.
                </p>
              </div>
              <Button onClick={handleRegisterPasskey} disabled={isRegistering}>
                {isRegistering ? (
                  <LoadingSpinner size="sm" label="Registering..." />
                ) : (
                  <>
                    <Fingerprint className="w-4 h-4 mr-2" />
                    Register New Passkey
                  </>
                )}
              </Button>
            </div>

            <PasskeyList
              passkeys={passkeys}
              isLoading={isLoadingPasskeys}
              onDeleteClick={(pk) => setPasskeyToDelete(pk)}
            />
          </CardContent>
        </Card>
      </main>

      <DeletePasskeyDialog
        passkey={passkeyToDelete}
        isOpen={Boolean(passkeyToDelete)}
        isDeleting={isDeleting}
        onClose={() => setPasskeyToDelete(null)}
        onConfirm={handleDeletePasskey}
      />
    </div>
  );
}
