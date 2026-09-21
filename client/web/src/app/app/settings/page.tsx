'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useVaultStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Fingerprint, ArrowLeft, Loader2 } from 'lucide-react';
import { registerPasskey } from '@/lib/webauthn';
import { toast } from 'sonner';

export default function SettingsPage() {
  const router = useRouter();
  const { isUnlocked } = useVaultStore();
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (!isUnlocked) {
      router.push('/app/unlock');
    }
  }, [isUnlocked, router]);

  const handleRegisterPasskey = async () => {
    setIsRegistering(true);
    try {
      const success = await registerPasskey();
      if (success) {
        toast.success('Passkey registered successfully! You can now use it to log in.');
      } else {
        toast.error('Failed to register passkey.');
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'An error occurred during passkey registration.');
    } finally {
      setIsRegistering(false);
    }
  };

  if (!isUnlocked) return null;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <header className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/app/vault')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Biometrics & Passkeys</CardTitle>
            <CardDescription>
              Register a passkey (Touch ID, Face ID, Windows Hello, or a security key) to log in without a password.
              Note: You will still need your Master Password to decrypt your vault.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleRegisterPasskey} disabled={isRegistering}>
              {isRegistering ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Fingerprint className="w-4 h-4 mr-2" />
              )}
              Register New Passkey
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}