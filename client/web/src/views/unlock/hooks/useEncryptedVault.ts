"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getVault } from "@/lib/auth";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export const ENCRYPTED_VAULT_QUERY_KEY = ["vault", "encrypted"] as const;

export function useEncryptedVault() {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useCurrentUser();

  const query = useQuery({
    queryKey: ENCRYPTED_VAULT_QUERY_KEY,
    queryFn: async () => {
      const data = await getVault();
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
    enabled: !!user && !isUserLoading,
  });

  const { data: vaultData, isLoading: isFetching, isSuccess } = query;

  // If fetched successfully but no vault exists, redirect to setup
  useEffect(() => {
    if (!user && !isUserLoading) {
      router.replace("/login");
    }

    if (isSuccess && vaultData === null) {
      router.replace("/app/setup");
    }
  }, [isSuccess, vaultData, router, user, isUserLoading]);

  return {
    vaultData,
    isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
