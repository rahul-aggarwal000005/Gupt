"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common";
import { Fingerprint } from "lucide-react";
import { PasskeySummary } from "@/lib/webauthn";
import { usePasskeys } from "../hooks/usePasskeys";
import { PasskeyList } from "./PasskeyList";
import { DeletePasskeyDialog } from "./DeletePasskeyDialog";

export function PasskeySection() {
  const {
    passkeys,
    isLoadingPasskeys,
    registerPasskey,
    isRegistering,
    deletePasskey,
    isDeleting,
  } = usePasskeys();

  const [passkeyToDelete, setPasskeyToDelete] = useState<PasskeySummary | null>(
    null,
  );

  const handleConfirmDelete = async () => {
    if (!passkeyToDelete) return;
    try {
      await deletePasskey(passkeyToDelete.id);
      setPasskeyToDelete(null);
    } catch {
      // Error handled inside usePasskeys mutation
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Biometrics & Passkeys</CardTitle>
          <CardDescription>
            Register a passkey (Touch ID, Face ID, Windows Hello, or a security
            key) to log in without a password. Note: You will still need your
            Master Password to decrypt your vault.
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
            <Button
              onClick={() => registerPasskey()}
              disabled={isRegistering}
              isLoading={isRegistering}
            >
              {isRegistering ? "Registering..." : "Register New Passkey"}
            </Button>
          </div>

          <PasskeyList
            passkeys={passkeys}
            isLoading={isLoadingPasskeys}
            onDeleteClick={(pk) => setPasskeyToDelete(pk)}
          />
        </CardContent>
      </Card>

      <DeletePasskeyDialog
        passkey={passkeyToDelete}
        isOpen={Boolean(passkeyToDelete)}
        isDeleting={isDeleting}
        onClose={() => setPasskeyToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
