"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Lock, ArrowRight, Code } from "lucide-react";
import { User } from "@/lib/auth";

export interface HeroSectionProps {
  user: User | null;
}

export function HeroSection({ user }: HeroSectionProps) {
  return (
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
          state-of-the-art WebCrypto APIs to ensure the server never sees your
          passwords.
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
          <a
            href="https://github.com/rahul-aggarwal000005/Gupt"
            target="_blank"
            rel="noreferrer"
          >
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
  );
}
