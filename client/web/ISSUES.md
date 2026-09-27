# Verified Issues: client/web

Audit summary and resolution status of all identified bugs, edge cases, and UI flickers in the `client/web` application.

---

## Resolved Issues

### 1. Infinite Recursion Loop on Concurrent 409 Sync Conflicts
- **Status**: **RESOLVED** (`a630753`)
- **Fix**: Added `MAX_SYNC_RETRIES = 3` and exponential backoff to `syncVault` and `fetchAndMerge` in `src/lib/store.ts`.

### 2. Clipboard Permission Prompt and Timeout Leak in `useClipboardCopy`
- **Status**: **RESOLVED** (`4a8632a`)
- **Fix**: Replaced `navigator.clipboard.readText()` with in-memory text reference tracking and a single managed `timeoutRef` with unmount cleanup.

### 3. Dropping the Return Route on Lock / Browser Refresh
- **Status**: **RESOLVED** (Current commit)
- **Fix**:
  - `SettingsPage` passes `?redirect=/app/settings` when locked.
  - `useUnlockVault` validates and redirects to the safe internal `redirectTarget` (`startsWith("/") && !startsWith("//")`).
  - `src/app/app/unlock/page.tsx` wrapped in `<Suspense>` for safe App Router prerendering.

### 4. Initial Mount Layout Shift in `GoogleSignInButton`
- **Status**: **RESOLVED** (`ae2c033`)
- **Fix**: Added fixed `h-11` container and styled `<Skeleton>` placeholder before client measurement.
