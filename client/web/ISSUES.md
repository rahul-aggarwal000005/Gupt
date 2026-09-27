# Identified Issues & Edge Cases: client/web

A comprehensive audit of the `client/web` application covering visual flickers, lifecycle race conditions, potential unhandled crashes, and UX edge cases.

---

## 1. Visual & Layout Flickers (CLS)

### 1.1 Initial Mount Layout Shift in `GoogleSignInButton`
- **Location**: [`src/views/auth/components/GoogleSignInButton.tsx`](src/views/auth/components/GoogleSignInButton.tsx)
- **Details**: `const [width, setWidth] = useState(0)` begins at `0`. On initial page render, `{width > 0 && <GoogleLogin ... />}` skips rendering the Google button until the browser completes its first layout paint and triggers the `ResizeObserver` callback.
- **Impact**: On `/login` and `/register`, the form renders without the button for a noticeable frame, causing the layout below it to jump downwards when the button snaps into place.
- **Fix**: Pre-populate a standard default width or mount a matching skeleton height (`h-11`) container so that layout dimensions remain stable before measurement.

---

## 2. Stability & Unhandled Exceptions

### 2.1 Unhandled `TypeError` Crash in `useVaultItems` on Missing/Corrupt Titles
- **Location**: [`src/views/vault/hooks/useVaultItems.ts`](src/views/vault/hooks/useVaultItems.ts)
- **Details**:
  ```ts
  const titleMatch = item.title.toLowerCase().includes(query);
  ```
  If an imported vault backup contains an item with a missing or nullish title, `item.title.toLowerCase()` throws a fatal runtime exception, unmounting the entire React tree.
- **Impact**: Breaks the vault dashboard for users who import incomplete or third-party backup exports.
- **Fix**: Safely guard title resolution: `(item.title || "").toLowerCase().includes(query)`.

### 2.2 Potential Infinite Recursion Loop on 409 Sync Conflicts in `store.ts`
- **Location**: [`src/lib/store.ts`](src/lib/store.ts)
- **Details**:
  When `syncVault()` encounters an HTTP 409 (version conflict), it delegates to `fetchAndMerge()`, which in step 5 calls `await get().syncVault()`.
  If multiple devices write concurrently, each retry could repeatedly hit a 409, recursing indefinitely without backoff or an attempt limit.
- **Impact**: Browser tab freeze, stack overflow, or client-side rate limiting by the server.
- **Fix**: Introduce a `retryCount = 0` with a maximum limit (e.g., max 3 retries) and exponential/jittered backoff before declaring a sync error.

---

## 3. Navigation & State Synchronization

### 3.1 Lost Return URL on Vault Lock / Refresh
- **Location**: [`src/views/unlock/UnlockPage.tsx`](src/views/unlock/UnlockPage.tsx) & [`src/views/settings/SettingsPage.tsx`](src/views/settings/SettingsPage.tsx)
- **Details**:
  Master encryption keys are held strictly in JS memory. When a user is on `/app/settings` and refreshes the browser, `isUnlocked` resets to `false`, kicking the user to `/app/unlock`. Once unlocked, `useUnlockVault` unconditionally redirects to `/app/vault`, losing the user's previous location.
- **Impact**: Frustrating navigation experience when refreshing settings or direct deep links.
- **Fix**: Pass `?redirect=/app/settings` to `/app/unlock` and redirect to the search param URL upon successful unlock if present.

### 3.2 Vault Query Cache Stale on Multi-Account Sign-In
- **Location**: [`src/views/unlock/hooks/useEncryptedVault.ts`](src/views/unlock/hooks/useEncryptedVault.ts)
- **Details**:
  `useQuery({ queryKey: ["vault", "encrypted"], staleTime: 5 * 60 * 1000 })` does not scope the cache key by the authenticated user's ID (`user.id`).
- **Impact**: If a user logs out and logs in as a different user within 5 minutes, TanStack Query may serve the previous user's cached encrypted vault envelope, leading to decryption failures or state desynchronization.
- **Fix**: Include user ID in query key: `["vault", "encrypted", user?.id]`, or ensure all vault caches are invalidated on user logout.

---

## 4. Resource Leaks & Browser Permissions

### 4.1 Unmanaged Clipboard Timeout & Permission Prompts in `useClipboardCopy`
- **Location**: [`src/views/vault/components/itemList/hooks/useClipboardCopy.ts`](src/views/vault/components/itemList/hooks/useClipboardCopy.ts)
- **Details**:
  - `setTimeout` is fired without tracking a ref or cleanup. Rapidly copying multiple items spawns overlapping timers.
  - Calling `navigator.clipboard.readText()` after 30 seconds triggers browser permission prompts in browsers like Safari and Firefox, or fails with an unhandled rejection if the document is unfocused.
- **Impact**: Console errors, unexpected clipboard permission popups, or clearing clipboard data that was overwritten by the user with something else.
- **Fix**: Maintain a single active timeout ref across copy actions. Avoid `readText()` where unsupported, or clear cleanly without prompting.
