"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listPasskeys,
  registerPasskey,
  deletePasskey,
  PasskeySummary,
} from "@/lib/webauthn";
import { toast } from "sonner";

export const PASSKEYS_QUERY_KEY = ["passkeys"] as const;

export function usePasskeys(enabled = true) {
  const queryClient = useQueryClient();

  const {
    data: passkeys = [],
    isLoading: isLoadingPasskeys,
    refetch: refetchPasskeys,
  } = useQuery<PasskeySummary[]>({
    queryKey: PASSKEYS_QUERY_KEY,
    queryFn: listPasskeys,
    enabled,
    staleTime: 1000 * 60 * 5,
  });

  const registerMutation = useMutation({
    mutationFn: registerPasskey,
    onSuccess: (success) => {
      if (success) {
        toast.success(
          "Passkey registered successfully! You can now use it to log in.",
        );
        queryClient.invalidateQueries({ queryKey: PASSKEYS_QUERY_KEY });
      } else {
        toast.error("Failed to register passkey.");
      }
    },
    onError: (error: unknown) => {
      console.error("Passkey registration error:", error);
      const message =
        (error as { response?: { data?: { error?: string } } }).response?.data
          ?.error ||
        (error as Error).message ||
        "An error occurred during passkey registration.";
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePasskey(id),
    onSuccess: () => {
      toast.success("Passkey removed successfully.");
      queryClient.invalidateQueries({ queryKey: PASSKEYS_QUERY_KEY });
    },
    onError: (error: unknown) => {
      console.error("Passkey deletion error:", error);
      const message =
        (error as { response?: { data?: { error?: string } } }).response?.data
          ?.error ||
        (error as Error).message ||
        "Failed to remove passkey.";
      toast.error(message);
    },
  });

  return {
    passkeys,
    isLoadingPasskeys,
    refetchPasskeys,
    registerPasskey: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    deletePasskey: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
