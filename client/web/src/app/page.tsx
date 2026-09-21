'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { checkHealth } from '@/lib/api';
import { getCurrentUser, logout, User } from '@/lib/auth';
import { Button } from '@/components/ui/button';

export default function Home() {
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check health
    checkHealth()
      .then((data) => setHealth(data))
      .catch((err) => setError(err.message));

    // Check auth status
    getCurrentUser()
      .then((userData) => setUser(userData))
      .finally(() => setIsLoading(false));
  }, []);

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">Gupt</h1>
          <p className="text-neutral-500 dark:text-neutral-400">Secure Password Manager</p>
        </div>

        {isLoading ? (
          <div className="text-center text-sm text-neutral-500">Loading...</div>
        ) : user ? (
          <div className="space-y-4 text-center">
            <p className="text-sm">
              Logged in as <span className="font-semibold">{user.email}</span>
            </p>
            <Button className="w-full" variant="outline" onClick={handleLogout}>
              Sign out
            </Button>
            <Button className="w-full">
              Unlock Vault
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Link href="/login" className="block">
              <Button className="w-full">Sign in</Button>
            </Link>
            <Link href="/register" className="block">
              <Button className="w-full" variant="outline">Create account</Button>
            </Link>
          </div>
        )}

        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <div className="p-4 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <h2 className="text-sm font-semibold mb-2">Backend Status</h2>
            {error ? (
              <p className="text-red-500 text-sm">{error}</p>
            ) : health ? (
              <pre className="text-xs text-green-600 overflow-auto">
                {JSON.stringify(health, null, 2)}
              </pre>
            ) : (
              <p className="text-neutral-500 text-sm animate-pulse">Checking...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}