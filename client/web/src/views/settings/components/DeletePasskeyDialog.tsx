"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PasskeySummary } from "@/lib/webauthn";

export interface DeletePasskeyDialogProps {
  passkey: PasskeySummary | null;
  isOpen: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeletePasskeyDialog({
  passkey,
  isOpen,
  isDeleting,
  onClose,
  onConfirm,
}: DeletePasskeyDialogProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isDeleting) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Remove Passkey</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove this{" "}
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
              {passkey?.label.toLowerCase()}
            </span>
            ? You will no longer be able to use it to sign in.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            isLoading={isDeleting}
          >
            {isDeleting ? "Removing..." : "Remove Passkey"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
