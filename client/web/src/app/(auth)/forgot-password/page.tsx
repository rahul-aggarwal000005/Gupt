"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { forgotPassword } from "@/lib/auth";
import { KeyRound, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function ForgotPasswordPage() {
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
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-neutral-950 selection:bg-indigo-100 selection:text-indigo-900 p-4 sm:p-8">
      <div className="w-full max-w-7xl mx-auto">
        <Link
          href="/login"
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to sign in
        </Link>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="border-slate-200/50 dark:border-neutral-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] rounded-2xl bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl">
            <CardHeader className="space-y-2 pb-6 pt-8 px-6 sm:px-8">
              <div className="flex items-center justify-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center">
                  {isSubmitted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <KeyRound className="w-5 h-5" />
                  )}
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {isSubmitted ? "Check your email" : "Forgot password?"}
                </CardTitle>
              </div>
              <CardDescription className="text-center text-slate-500">
                {isSubmitted
                  ? "If an account exists with that email, we've sent a password reset link."
                  : "Enter your email and we'll send you a link to reset your password."}
              </CardDescription>
            </CardHeader>

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
                    <Mail className="w-4 h-4 mr-2" />
                    {isLoading ? "Sending..." : "Send reset link"}
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
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
