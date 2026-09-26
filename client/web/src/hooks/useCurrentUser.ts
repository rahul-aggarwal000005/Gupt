"use client";

import { useQuery } from "@tanstack/react-query";
import { getCurrentUser, User } from "@/lib/auth";

export const USER_QUERY_KEY = ["currentUser"] as const;

export function useCurrentUser() {
  const query = useQuery<User | null>({
    queryKey: USER_QUERY_KEY,
    queryFn: getCurrentUser,
    staleTime: 5 * 60 * 1000, // Kept fresh for 5 mins; prevents refetching during page navigation
  });

  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
