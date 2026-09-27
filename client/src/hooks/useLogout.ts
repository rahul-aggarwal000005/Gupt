"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logout as apiLogout } from "@/lib/auth";
import { USER_QUERY_KEY } from "./useCurrentUser";

export function useLogout() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: apiLogout,
    onSuccess: () => {
      // 1. Immediately reset the user query to null
      queryClient.setQueryData(USER_QUERY_KEY, null);
      // 2. Wipe sensitive query cache in memory
      queryClient.clear();
    },
  });

  return {
    logout: mutation.mutateAsync,
    isLoggingOut: mutation.isPending,
    error: mutation.error,
  };
}
