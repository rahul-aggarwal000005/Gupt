"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

import { useLogout } from "@/hooks/useLogout";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useCallback, useMemo } from "react";
import { User } from "@/lib/auth";

const LoggdedInContent = ({
  user,
  isLoading,
}: {
  user: User | null;
  isLoading: boolean;
}) => {
  const { logout, isLoggingOut } = useLogout();

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  if (user === null || isLoading) return null;

  return (
    <>
      <span className="text-sm text-slate-500 hidden sm:inline-block">
        {user.email}
      </span>
      <Button
        variant="outline"
        className="px-5 rounded-full font-medium shadow-sm hover:scale-[1.02] transition-transform duration-200"
        onClick={handleLogout}
        isLoading={isLoggingOut}
        disabled={isLoggingOut}
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
  );
};

const LoggedOutContent = () => {
  return (
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
  );
};

export function LandingNavbar() {
  const { user, isLoading } = useCurrentUser();

  const content = useMemo(() => {
    if (isLoading || user)
      return <LoggdedInContent user={user} isLoading={isLoading} />;

    return <LoggedOutContent />;
  }, [isLoading, user]);

  return (
    <nav className="border-b border-slate-200/50 dark:border-neutral-800/50 bg-white/50 dark:bg-neutral-950/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          <span className="text-xl font-bold tracking-tight">Gupt</span>
        </Link>
        <div className="flex items-center space-x-4">{content}</div>
      </div>
    </nav>
  );
}
