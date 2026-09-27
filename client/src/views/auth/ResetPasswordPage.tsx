"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CardContent, CardFooter } from "@/components/ui/card";
import {
  AuthCardWrapper,
  PasswordInput,
  LoadingSpinner,
} from "@/components/common";
import { resetPassword } from "@/lib/auth";
import { Shield, CheckCircle2 } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!isSuccess) return;

    const timer = setTimeout(() => {
      router.replace("/login");
    }, 3000);

    return () => clearTimeout(timer);
  }, [isSuccess, router]);

  const { mutateAsync: performResetPassword, isPending } = useMutation({
    mutationFn: ({
      resetToken,
      newPassword,
    }: {
      resetToken: string;
      newPassword: string;
    }) => resetPassword(resetToken, newPassword),
    onMutate: () => setError(""),
    onSuccess: () => {
      setIsSuccess(true);
    },
    onError: (err: unknown) => {
      const errorObj = err as { response?: { data?: { error?: string } } };
      setError(
        errorObj.response?.data?.error ||
          "Failed to reset password. The link may be expired.",
      );
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (!token) {
      setError("Invalid reset link. Please request a new one.");
      return;
    }

    await performResetPassword({ resetToken: token, newPassword: password });
  };

  // Invalid or missing token state
  if (!token) {
    return (
      <AuthCardWrapper
        title="Invalid link"
        description="This password reset link is invalid or missing. Please request a new one."
        icon={<Shield className="w-5 h-5 text-red-600 dark:text-red-400" />}
        backHref="/login"
        backLabel="Back to sign in"
      >
        <CardFooter className="flex flex-col space-y-4 pt-2 pb-8 px-6 sm:px-8">
          <Button
            className="w-full h-11 rounded-xl font-medium shadow-sm hover:scale-[1.02] transition-transform duration-200"
            onClick={() => router.push("/forgot-password")}
          >
            Request new reset link
          </Button>
          <div className="text-sm text-center text-slate-500 mt-4">
            <Link
              href="/login"
              className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
            >
              ← Back to sign in
            </Link>
          </div>
        </CardFooter>
      </AuthCardWrapper>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <AuthCardWrapper
        title="Password reset!"
        description="Your password has been successfully reset. Redirecting to sign in..."
        icon={
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        }
        backHref="/login"
        backLabel="Back to sign in"
      >
        <CardFooter className="flex flex-col space-y-4 pt-2 pb-8 px-6 sm:px-8">
          <Button
            className="w-full h-11 rounded-xl font-medium shadow-sm hover:scale-[1.02] transition-transform duration-200"
            onClick={() => router.replace("/login")}
          >
            Go to sign in
          </Button>
        </CardFooter>
      </AuthCardWrapper>
    );
  }

  // Form state
  return (
    <AuthCardWrapper
      title="Set new password"
      description="Enter your new password below"
      backHref="/login"
      backLabel="Back to sign in"
      isLoading={isPending}
      loadingMessage="Resetting password..."
    >
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6 pb-6 px-6 sm:px-8">
          <div className="space-y-2.5">
            <Label
              htmlFor="password"
              className="text-slate-700 dark:text-slate-300"
            >
              New password
            </Label>
            <PasswordInput
              id="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
            <p className="text-xs text-slate-500 mt-1.5">
              Must be at least 8 characters long.
            </p>
          </div>
          <div className="space-y-2.5">
            <Label
              htmlFor="confirmPassword"
              className="text-slate-700 dark:text-slate-300"
            >
              Confirm new password
            </Label>
            <PasswordInput
              id="confirmPassword"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-2 pb-8 px-6 sm:px-8">
          <Button
            className="w-full h-11 rounded-xl font-medium shadow-sm hover:scale-[1.02] transition-transform duration-200"
            type="submit"
            disabled={isPending}
            isLoading={isPending}
          >
            Reset password
          </Button>
          <div className="text-sm text-center text-slate-500 mt-4">
            <Link
              href="/login"
              className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
            >
              ← Back to sign in
            </Link>
          </div>
        </CardFooter>
      </form>
    </AuthCardWrapper>
  );
}

export function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthCardWrapper
          title="Set new password"
          description="Loading reset token..."
          backHref="/login"
          backLabel="Back to sign in"
        >
          <CardContent className="flex items-center justify-center py-16">
            <LoadingSpinner size="lg" label="Loading..." />
          </CardContent>
        </AuthCardWrapper>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
