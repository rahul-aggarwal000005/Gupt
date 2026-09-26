"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardContent, CardFooter } from "@/components/ui/card";
import { AuthCardWrapper, PasswordInput } from "@/components/common";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { useAuthMutations } from "@/hooks/useAuthMutations";
import { AuthDivider } from "./components/AuthDivider";
import { PasskeyButton } from "./components/PasskeyButton";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const {
    loginWithEmail,
    loginWithPasskey,
    loginWithGoogle,
    onGoogleError,
    isEmailLoggingIn,
    isPasskeyLoggingIn,
    disabled,
    error,
  } = useAuthMutations();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await loginWithEmail({ email, password });
  };

  const handlePasskeyLogin = async () => {
    await loginWithPasskey(email);
  };

  return (
    <AuthCardWrapper
      title="Welcome back"
      description="Enter your details to sign in to your vault"
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
            <div className="flex justify-between items-center">
              <Label
                htmlFor="password"
                className="text-slate-700 dark:text-slate-300"
              >
                Password
              </Label>
              <Link
                href="/forgot-password"
                className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-2 pb-8 px-6 sm:px-8">
          <Button
            className="w-full h-11 rounded-xl font-medium shadow-sm hover:scale-[1.02] transition-transform duration-200"
            type="submit"
            disabled={disabled}
            isLoading={isEmailLoggingIn}
          >
            Sign in
          </Button>

          <AuthDivider />

          <div className="w-full space-y-3">
            <GoogleSignInButton
              onSuccess={loginWithGoogle}
              onError={onGoogleError}
              disabled={disabled}
            />

            <PasskeyButton
              onClick={handlePasskeyLogin}
              isLoading={isPasskeyLoggingIn}
              disabled={disabled}
            />
          </div>

          <div className="text-sm text-center text-slate-500 mt-4">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
            >
              Sign up
            </Link>
          </div>
        </CardFooter>
      </form>
    </AuthCardWrapper>
  );
}
