"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { login } from "@/lib/auth";
import { loginWithPasskey } from "@/lib/webauthn";
import { Fingerprint, Shield, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
      router.push("/app/unlock");
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasskeyLogin = async () => {
    if (!email) {
      setError("Please enter your email first to use a passkey.");
      return;
    }
    setError("");
    setIsPasskeyLoading(true);

    try {
      await loginWithPasskey(email);
      router.push("/app/unlock");
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || "Passkey login failed");
    } finally {
      setIsPasskeyLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-neutral-950 selection:bg-indigo-100 selection:text-indigo-900 p-4 sm:p-8">
      <div className="w-full max-w-7xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to home
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
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Welcome back
                </CardTitle>
              </div>
              <CardDescription className="text-center text-slate-500">
                Enter your details to sign in to your vault
              </CardDescription>
            </CardHeader>
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
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-11 rounded-xl bg-white dark:bg-neutral-900 focus-visible:ring-indigo-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                {error && (
                  <p className="text-sm text-red-500 font-medium">{error}</p>
                )}
              </CardContent>
              <CardFooter className="flex flex-col space-y-4 pt-2 pb-8 px-6 sm:px-8">
                <Button
                  className="w-full h-11 rounded-xl font-medium shadow-sm hover:scale-[1.02] transition-transform duration-200"
                  type="submit"
                  disabled={isLoading || isPasskeyLoading}
                >
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>

                <div className="relative w-full py-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200 dark:border-neutral-800" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase font-semibold tracking-wider">
                    <span className="bg-slate-50 dark:bg-neutral-950 px-2 text-slate-400">
                      Or continue with
                    </span>
                  </div>
                </div>

                <Button
                  className="w-full h-11 rounded-xl font-medium shadow-sm hover:scale-[1.02] transition-transform duration-200 hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-700 dark:text-slate-200"
                  variant="outline"
                  type="button"
                  onClick={handlePasskeyLogin}
                  disabled={isLoading || isPasskeyLoading}
                >
                  <Fingerprint className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                  {isPasskeyLoading ? "Waiting..." : "Passkey"}
                </Button>

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
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
