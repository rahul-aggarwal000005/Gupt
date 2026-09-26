"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Shield } from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LoadingOverlay } from "./LoadingOverlay";

export interface AuthCardWrapperProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  maxWidth?: string;
  className?: string;
  isLoading?: boolean;
  loadingMessage?: string;
  children: React.ReactNode;
}

export function AuthCardWrapper({
  title,
  description,
  icon,
  backHref = "/",
  backLabel = "Back to home",
  maxWidth = "max-w-md",
  className,
  isLoading = false,
  loadingMessage,
  children,
}: AuthCardWrapperProps) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-neutral-950 selection:bg-indigo-100 selection:text-indigo-900 p-4 sm:p-8">
      {backHref && (
        <div className="w-full max-w-7xl mx-auto">
          <Link
            href={backHref}
            className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {backLabel}
          </Link>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={cn("w-full", maxWidth, className)}
        >
          <Card className="relative overflow-hidden border-slate-200/50 dark:border-neutral-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] rounded-2xl bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl">
            {isLoading && (
              <LoadingOverlay message={loadingMessage} />
            )}
            <CardHeader className="space-y-2 pb-6 pt-8 px-6 sm:px-8">
              <div className="flex items-center justify-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                  {icon || <Shield className="w-5 h-5" />}
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {title}
                </CardTitle>
              </div>
              {description && (
                <CardDescription className="text-center text-slate-500">
                  {description}
                </CardDescription>
              )}
            </CardHeader>
            {children}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
