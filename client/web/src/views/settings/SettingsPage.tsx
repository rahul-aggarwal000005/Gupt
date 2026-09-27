"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useVaultStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { PasskeySection } from "./components/PasskeySection";

export function SettingsPage() {
  const router = useRouter();
  const { isUnlocked } = useVaultStore();

  useEffect(() => {
    if (!isUnlocked) {
      router.push("/app/unlock");
    }
  }, [isUnlocked, router]);

  if (!isUnlocked) return null;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <header className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/app/vault")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        <PasskeySection />
      </main>
    </div>
  );
}
