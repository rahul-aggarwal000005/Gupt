'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { deriveKey, encryptVault, generateIV, generateSalt, bufferToBase64 } from '@/lib/crypto';
import { updateVault } from '@/lib/auth';
import { useVaultStore, EncryptedVaultPayload, VaultData } from '@/lib/store';

export default function SetupVaultPage() {
  const router = useRouter();
  const [masterPassword, setMasterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const unlockVault = useVaultStore((state) => state.unlockVault);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (masterPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (masterPassword.length < 12) {
      setError('Master Password must be at least 12 characters long');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Generate salt and IV
      const salt = generateSalt();
      const iv = generateIV();

      // 2. Derive key
      const key = await deriveKey(masterPassword, salt);

      // 3. Create initial empty vault
      const initialVaultData: VaultData = { items: [] };
      const plaintext = JSON.stringify(initialVaultData);

      // 4. Encrypt vault
      const ciphertext = await encryptVault(plaintext, key, iv);

      // 5. Construct payload
      const payload: EncryptedVaultPayload = {
        algorithm: 'AES-256-GCM',
        kdf: 'Argon2id',
        salt: bufferToBase64(salt),
        iv: bufferToBase64(iv),
        ciphertext: bufferToBase64(ciphertext),
      };

      // 6. Send to server (version 1)
      const response = await updateVault(1, JSON.stringify(payload));

      // 7. Store in memory and redirect
      unlockVault(key, initialVaultData, response.version, payload.salt);
      router.push('/app/vault');
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      console.error(err);
      setError(error.response?.data?.error || 'Failed to setup vault');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Setup Master Password</CardTitle>
          <CardDescription className="text-center text-red-500 font-medium">
            This password encrypts your vault. If you lose it, your data cannot be recovered.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="masterPassword">Master Password</Label>
              <Input
                id="masterPassword"
                type="password"
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                required
                minLength={12}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Master Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={12}
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? 'Creating Vault...' : 'Create Vault'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}