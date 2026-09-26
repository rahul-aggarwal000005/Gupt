"use client";

import { useEffect, useState } from "react";
import { getCurrentUser, logout, User } from "@/lib/auth";
import { LandingNavbar } from "./components/LandingNavbar";
import { HeroSection } from "./components/HeroSection";
import { FeaturesSection } from "./components/FeaturesSection";
import { LandingFooter } from "./components/LandingFooter";

export function LandingPage() {
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
      <LandingNavbar
        user={user}
        isLoading={isLoading}
        onLogout={handleLogout}
      />
      <main>
        <HeroSection user={user} />
        <FeaturesSection />
      </main>
      <LandingFooter />
    </div>
  );
}
