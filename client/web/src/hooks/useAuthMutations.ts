"use client";

import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { login, register, loginWithGoogle, User } from "@/lib/auth";
import { loginWithPasskey } from "@/lib/webauthn";
import { USER_QUERY_KEY } from "./useCurrentUser";

function getErrorMessage(err: unknown, fallback: string): string {
  const errorObj = err as {
    response?: { data?: { error?: string } };
    message?: string;
  };

  return errorObj.response?.data?.error || errorObj.message || fallback;
}

export function useAuthMutations() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [error, setError] = useState<string>("");

  const handleSuccess = useCallback(
    (user: User, redirectPath: string = "/app/unlock") => {
      setError("");
      queryClient.setQueryData(USER_QUERY_KEY, user);
      router.replace(redirectPath);
    },
    [queryClient, router],
  );

  const handleError = useCallback((err: unknown, fallbackMsg: string) => {
    const message = getErrorMessage(err, fallbackMsg);
    setError(message);
  }, []);

  const emailLoginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      login(email, password),
    onMutate: () => setError(""),
    onSuccess: (data) => handleSuccess(data.user, "/app/unlock"),
    onError: (err) => handleError(err, "Invalid email or password"),
  });

  const registerMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      register(email, password),
    onMutate: () => setError(""),
    onSuccess: (data) => handleSuccess(data.user, "/app/setup"),
    onError: (err) => handleError(err, "Registration failed"),
  });

  const passkeyLoginMutation = useMutation({
    mutationFn: async (email: string) => {
      if (!email || !email.trim()) {
        throw new Error("Please enter your email first to use a passkey.");
      }
      return loginWithPasskey(email.trim());
    },
    onMutate: () => setError(""),
    onSuccess: (data) => handleSuccess(data.user, "/app/unlock"),
    onError: (err) => handleError(err, "Passkey login failed"),
  });

  const googleLoginMutation = useMutation({
    mutationFn: (credential: string) => loginWithGoogle(credential),
    onMutate: () => setError(""),
    onSuccess: (data) => handleSuccess(data.user, "/app/unlock"),
    onError: (err) => handleError(err, "Google sign-in failed"),
  });

  const handleGoogleError = useCallback(() => {
    handleError(
      new Error("Google sign-in was cancelled or failed"),
      "Google sign-in was cancelled or failed",
    );
  }, [handleError]);

  const isAuthenticating =
    emailLoginMutation.isPending ||
    registerMutation.isPending ||
    passkeyLoginMutation.isPending ||
    googleLoginMutation.isPending;

  return {
    loginWithEmail: emailLoginMutation.mutateAsync,
    isEmailLoggingIn: emailLoginMutation.isPending,

    registerWithEmail: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,

    loginWithPasskey: passkeyLoginMutation.mutateAsync,
    isPasskeyLoggingIn: passkeyLoginMutation.isPending,

    loginWithGoogle: googleLoginMutation.mutateAsync,
    isGoogleLoggingIn: googleLoginMutation.isPending,
    onGoogleError: handleGoogleError,

    isAuthenticating,
    error,
    setError,
  };
}
