"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardContent, CardFooter } from "@/components/ui/card";
import { AuthCardWrapper, PasswordInput } from "@/components/common";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { register, loginWithGoogle } from "@/lib/auth";
import { AuthDivider } from "./components/AuthDivider";

export function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const isBusy = isLoading || isGoogleLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await register(email, password);
      router.push("/app/setup");
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credential: string) => {
    setError("");
    setIsGoogleLoading(true);

    try {
      await loginWithGoogle(credential);
      router.push("/app/unlock");
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || "Google sign-up failed");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError("Google sign-up was cancelled or failed");
  };

  return (
    <AuthCardWrapper
      title="Create an account"
      description="Sign up to start securing your passwords"
      backHref="/"
      backLabel="Back to home"
    >
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
          <div className="space-y-2.5">
            <Label
              htmlFor="password"
              className="text-slate-700 dark:text-slate-300"
            >
              Password
            </Label>
            <PasswordInput
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
            <p className="text-xs text-slate-500 mt-1.5">
              Must be at least 8 characters long.
            </p>
          </div>
          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-2 pb-8 px-6 sm:px-8">
          <Button
            className="w-full h-11 rounded-xl font-medium shadow-sm hover:scale-[1.02] transition-transform duration-200"
            type="submit"
            disabled={isBusy}
            isLoading={isLoading}
          >
            Create account
          </Button>

          <AuthDivider />

          <GoogleSignInButton
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            disabled={isBusy}
            mode="signup"
          />

          <div className="text-sm text-center text-slate-500 mt-4">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
            >
              Sign in
            </Link>
          </div>
        </CardFooter>
      </form>
    </AuthCardWrapper>
  );
}
