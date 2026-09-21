import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useVaultStore } from '@/lib/store';

// Default auto-lock time: 5 minutes
const AUTO_LOCK_TIMEOUT_MS = 5 * 60 * 1000;

export function useAutoLock(timeoutMs: number = AUTO_LOCK_TIMEOUT_MS) {
  const router = useRouter();
  const { isUnlocked, lockVault } = useVaultStore();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isUnlocked) return;

    const handleLock = () => {
      lockVault();
      router.push('/app/unlock');
    };

    const resetTimer = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(handleLock, timeoutMs);
    };

    // Events that indicate user activity
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];

    // Initial setup
    resetTimer();

    // Add listeners
    events.forEach((event) => {
      document.addEventListener(event, resetTimer);
    });

    // Also lock if the tab becomes hidden for too long (optional security enhancement)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Could lock immediately here if desired:
        // handleLock();
      } else {
        resetTimer();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach((event) => {
        document.removeEventListener(event, resetTimer);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isUnlocked, lockVault, router, timeoutMs]);
}