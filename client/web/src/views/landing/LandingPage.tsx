"use client";

import { LandingNavbar } from "./components/LandingNavbar";
import { HeroSection } from "./components/HeroSection";
import { FeaturesSection } from "./components/FeaturesSection";
import { LandingFooter } from "./components/LandingFooter";

import { useCurrentUser } from "@/hooks/useCurrentUser";

export function LandingPage() {
  const { user } = useCurrentUser();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-neutral-950 selection:bg-indigo-100 selection:text-indigo-900">
      <LandingNavbar />
      <main>
        <HeroSection user={user} />
        <FeaturesSection />
      </main>
      <LandingFooter />
    </div>
  );
}
