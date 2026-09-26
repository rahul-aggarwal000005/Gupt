"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common";
import {
  PasskeySummary,
  PasskeyKind,
} from "@/lib/webauthn";
import {
  Fingerprint,
  Key,
  Cloud,
  Smartphone,
  Trash2,
} from "lucide-react";

export interface PasskeyListProps {
  passkeys: PasskeySummary[];
  isLoading: boolean;
  onDeleteClick: (passkey: PasskeySummary) => void;
}

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

function getPasskeyIcon(kind: PasskeyKind) {
  switch (kind) {
    case "security_key":
      return <Key className="w-5 h-5 text-amber-500" />;
    case "synced":
      return <Cloud className="w-5 h-5 text-blue-500" />;
    case "this_device":
    default:
      return <Smartphone className="w-5 h-5 text-emerald-500" />;
  }
}

export function PasskeyList({
  passkeys,
  isLoading,
  onDeleteClick,
}: PasskeyListProps) {
  if (isLoading) {
    return (
      <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden divide-y divide-neutral-200 dark:divide-neutral-800 bg-white dark:bg-neutral-950/40">
        <PasskeyListSkeleton />
      </div>
    );
  }

  if (passkeys.length === 0) {
    return (
      <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-white dark:bg-neutral-950/40">
        <EmptyState
          icon={<Fingerprint className="w-6 h-6 text-slate-400" />}
          title="No passkeys registered"
          description="Add a passkey for instant, passwordless sign in to your account."
          className="border-none py-8"
        />
      </div>
    );
  }

  return (
    <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden divide-y divide-neutral-200 dark:divide-neutral-800 bg-white dark:bg-neutral-950/40">
      {passkeys.map((passkey) => (
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
                {new Date(passkey.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="text-neutral-400 hover:text-red-600 dark:hover:text-red-400"
            onClick={() => onDeleteClick(passkey)}
            title="Remove passkey"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
