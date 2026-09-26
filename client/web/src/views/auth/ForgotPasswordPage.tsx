"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardContent, CardFooter } from "@/components/ui/card";
import { AuthCardWrapper, LoadingSpinner } from "@/components/common";
import { forgotPassword } from "@/lib/auth";
import { KeyRound, Mail, CheckCircle2 } from "lucide-react";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resetUrl, setResetUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await forgotPassword(email);
      setIsSubmitted(true);
      // In development, the server returns the reset URL for easy testing
      if (result.resetUrl) {
        setResetUrl(result.resetUrl);
      }
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(
        error.response?.data?.error || "An error occurred. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthCardWrapper
      title={isSubmitted ? "Check your email" : "Forgot password?"}
      description={
        isSubmitted
          ? "If an account exists with that email, we've sent a password reset link."
          : "Enter your email and we'll send you a link to reset your password."
      }
      icon={
        isSubmitted ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <KeyRound className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        )
      }
      backHref="/login"
      backLabel="Back to sign in"
    >
      {!isSubmitted ? (
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 pb-6 px-6 sm:px-8">
            <div className="space-y-2.5">
              <Label
                htmlFor="email"
                className="text-slate-700 dark:text-slate-300"
              >
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 rounded-xl bg-white dark:bg-neutral-900 focus-visible:ring-indigo-500"
              />
            </div>
            {error && (
              <p className="text-sm text-red-500 font-medium">{error}</p>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-2 pb-8 px-6 sm:px-8">
            <Button
              className="w-full h-11 rounded-xl font-medium shadow-sm hover:scale-[1.02] transition-transform duration-200"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <LoadingSpinner size="sm" label="Sending..." />
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send reset link
                </>
              )}
            </Button>
            <div className="text-sm text-center text-slate-500 mt-4">
              Remember your password?{" "}
              <Link
                href="/login"
                className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
              >
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      ) : (
        <CardContent className="space-y-6 pb-8 px-6 sm:px-8">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-4">
            <p className="text-sm text-emerald-700 dark:text-emerald-300">
              A password reset link has been generated. Check the server
              console for the link or your email inbox.
            </p>
          </div>

          {resetUrl && (
            <div className="bg-slate-100 dark:bg-neutral-800 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Dev Mode — Reset Link
              </p>
              <Link
                href={resetUrl.replace(/^https?:\/\/[^/]+/, "")}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline break-all"
              >
                {resetUrl}
              </Link>
            </div>
          )}

          <div className="text-sm text-center text-slate-500">
            <Link
              href="/login"
              className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
            >
              ← Back to sign in
            </Link>
          </div>
        </CardContent>
      )}
    </AuthCardWrapper>
  );
}
