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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Fingerprint,
  ArrowLeft,
  Loader2,
  Key,
  Cloud,
  Smartphone,
  Trash2,
} from "lucide-react";
import {
  registerPasskey,
  listPasskeys,
  deletePasskey,
  PasskeySummary,
  PasskeyKind,
} from "@/lib/webauthn";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

function PasskeyListSkeleton() {
  return (
    <>
      {[0, 1].map((i) => (
        <div
          key={i}
          className="p-4 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 last:border-b-0"
        >
          <div className="flex items-center space-x-3.5">
            <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-8 w-8 rounded-md shrink-0" />
        </div>
      ))}
    </>
  );
}

export default function SettingsPage() {
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

  const getPasskeyIcon = (kind: PasskeyKind) => {
    switch (kind) {
      case "security_key":
        return <Key className="w-5 h-5 text-amber-500" />;
      case "synced":
        return <Cloud className="w-5 h-5 text-blue-500" />;
      case "this_device":
      default:
        return <Smartphone className="w-5 h-5 text-emerald-500" />;
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
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Fingerprint className="w-4 h-4 mr-2" />
                )}
                Register New Passkey
              </Button>
            </div>

            <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden divide-y divide-neutral-200 dark:divide-neutral-800 bg-white dark:bg-neutral-950/40">
              {isLoadingPasskeys ? (
                <PasskeyListSkeleton />
              ) : passkeys.length === 0 ? (
                <div className="p-8 text-center text-sm text-neutral-500">
                  No passkeys registered yet.
                </div>
              ) : (
                passkeys.map((passkey) => (
                  <div
                    key={passkey.id}
                    className="p-4 flex items-center justify-between hover:bg-neutral-50/70 dark:hover:bg-neutral-900/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                        {getPasskeyIcon(passkey.kind)}
                      </div>
                      <div>
                        <div className="font-medium text-sm text-neutral-900 dark:text-neutral-100">
                          {passkey.label}
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">
                          Added{" "}
                          {new Date(passkey.createdAt).toLocaleDateString(
                            undefined,
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-neutral-400 hover:text-red-600 dark:hover:text-red-400"
                      onClick={() => setPasskeyToDelete(passkey)}
                      title="Remove passkey"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      <Dialog
        open={!!passkeyToDelete}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setPasskeyToDelete(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove Passkey</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this{" "}
              <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                {passkeyToDelete?.label.toLowerCase()}
              </span>
              ? You will no longer be able to use it to sign in.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setPasskeyToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePasskey}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove Passkey"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
