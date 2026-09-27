"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/common";
import { Fingerprint } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PasskeyButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  label?: string;
  loadingLabel?: string;
}

export function PasskeyButton({
  onClick,
  isLoading = false,
  disabled = false,
  className,
  label = "Sign in with Passkey",
  loadingLabel = "Authenticating...",
}: PasskeyButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className={cn(
        "w-full h-11 rounded-xl font-medium border-slate-200 dark:border-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-800 transition-colors",
        className,
      )}
      onClick={onClick}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <LoadingSpinner size="sm" label={loadingLabel} />
      ) : (
        <>
          <Fingerprint className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-400" />
          {label}
        </>
      )}
    </Button>
  );
}
