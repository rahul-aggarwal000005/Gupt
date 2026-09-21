"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCurrentUser, logout, User } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Shield, Key, Server, Lock, ArrowRight, Code } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then((userData) => setUser(userData))
      .finally(() => setIsLoading(false));
  }, []);

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-neutral-950 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navigation Bar */}
      <nav className="border-b border-slate-200/50 dark:border-neutral-800/50 bg-white/50 dark:bg-neutral-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xl font-bold tracking-tight">Gupt</span>
          </div>
          <div className="flex items-center space-x-4">
            {isLoading ? null : user ? (
              <>
                <span className="text-sm text-slate-500 hidden sm:inline-block">
                  {user.email}
                </span>
                <Button
                  variant="outline"
                  className="px-5 rounded-full font-medium shadow-sm hover:scale-[1.02] transition-transform duration-200"
                  onClick={handleLogout}
                >
                  Log out
                </Button>
                <Link href="/app/unlock">
                  <Button
                    variant="default"
                    className="px-5 rounded-full font-medium shadow-sm hover:scale-[1.02] transition-transform duration-200"
                  >
                    Go to Vault
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button
                    variant="outline"
                    className="px-5 rounded-full font-medium shadow-sm hover:scale-[1.02] transition-transform duration-200"
                  >
                    Log in
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="px-5 rounded-full font-medium shadow-sm hover:scale-[1.02] transition-transform duration-200">
                    Sign up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-6 min-h-[calc(100vh-6rem)] flex flex-col justify-center text-center overflow-hidden pb-16">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center space-x-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full text-sm font-medium mb-8"
            >
              <Lock className="w-4 h-4" />
              <span>End-to-End Encrypted</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6"
            >
              Your secrets, <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500">
                completely in your control.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="max-w-2xl mx-auto text-lg text-slate-600 dark:text-neutral-400 mb-10"
            >
              Gupt is an open-source, self-hosted password manager that uses
              state-of-the-art WebCrypto APIs to ensure the server never sees
              your passwords.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4"
            >
              <Link href={user ? "/app/unlock" : "/register"}>
                <Button
                  size="lg"
                  className="h-12 px-8 text-base rounded-full shadow-sm hover:scale-[1.02] transition-transform duration-200"
                >
                  {user ? "Access your Vault" : "Get Started for Free"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <a href="https://github.com" target="_blank" rel="noreferrer">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 px-8 text-base rounded-full shadow-sm hover:scale-[1.02] transition-transform duration-200 hover:bg-slate-100 dark:hover:bg-neutral-800"
                >
                  <Code className="w-4 h-4 mr-2" />
                  View on GitHub
                </Button>
              </a>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-white dark:bg-neutral-900 border-y border-slate-200/50 dark:border-neutral-800/50 py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-12">
              {/* Feature 1 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="space-y-4"
              >
                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                  <Key className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold">Passkey Support</h3>
                <p className="text-slate-600 dark:text-neutral-400">
                  Log in securely without a password using Touch ID, Face ID, or
                  Windows Hello via modern WebAuthn standards.
                </p>
              </motion.div>

              {/* Feature 2 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="space-y-4"
              >
                <div className="w-12 h-12 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold">
                  Zero-Knowledge Architecture
                </h3>
                <p className="text-slate-600 dark:text-neutral-400">
                  Data is encrypted on your device using AES-256-GCM before it
                  ever reaches the server. We couldn&apos;t read it even if we
                  wanted to.
                </p>
              </motion.div>

              {/* Feature 3 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="space-y-4"
              >
                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
                  <Server className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold">Self-Hostable</h3>
                <p className="text-slate-600 dark:text-neutral-400">
                  Deploy Gupt on your own infrastructure using Docker. Keep your
                  data entirely within your own network.
                </p>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between text-slate-500 text-sm">
        <p>© {new Date().getFullYear()} Gupt. Open source software.</p>
        <p className="mt-2 md:mt-0">Built with Next.js, Express, and Prisma.</p>
      </footer>
    </div>
  );
}
