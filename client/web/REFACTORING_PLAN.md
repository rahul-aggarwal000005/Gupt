# Web Frontend Refactoring Plan: Modular Architecture

This document outlines the refactoring strategy for `client/web/src` to decouple Next.js routing from UI page logic, isolate domain components, and establish reusable shared components.

---

## 1. Architectural Strategy

### Next.js App Router Boundary Rule
Next.js reserves `src/pages` for the legacy Pages Router. Adding a folder named `src/pages` causes Next.js to scan it for page routes and can cause routing conflicts or build failures with the App Router (`src/app`).

To follow the desired pattern safely:
- **`src/app/`**: Acts purely as a **routing shell**. Files (`page.tsx`, `layout.tsx`) handle route params, page metadata, search params, and render the top-level view component. Minimal to zero business/UI logic.
- **`src/views/`** (or `src/pages-ui/`): Contains the actual full-page implementations and their page-specific subcomponents.
- **`src/components/`**: Houses cross-cutting, reusable components shared across multiple views.

---

## 2. Target Directory Structure

```text
client/web/src/
├── app/                             # Thin route adapters (3-10 lines per page.tsx)
│   ├── (auth)/
│   │   ├── login/page.tsx           # Renders <LoginPage />
│   │   ├── register/page.tsx        # Renders <RegisterPage />
│   │   ├── forgot-password/page.tsx # Renders <ForgotPasswordPage />
│   │   └── reset-password/page.tsx  # Renders <ResetPasswordPage />
│   ├── app/
│   │   ├── vault/page.tsx           # Renders <VaultPage />
│   │   ├── settings/page.tsx        # Renders <SettingsPage />
│   │   ├── setup/page.tsx           # Renders <SetupPage />
│   │   └── unlock/page.tsx          # Renders <UnlockPage />
│   ├── layout.tsx                   # Root HTML shell & ThemeProvider
│   └── page.tsx                     # Renders <LandingPage />
│
├── views/                           # Modular view components by route/domain
│   ├── landing/
│   │   ├── index.tsx                # Main Landing page view
│   │   └── components/
│   │       ├── HeroSection.tsx
│   │       ├── FeaturesSection.tsx
│   │       └── ArchitectureSection.tsx
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── ForgotPasswordPage.tsx
│   │   ├── ResetPasswordPage.tsx
│   │   └── components/
│   │       ├── AuthCardWrapper.tsx  # Shared container, logo & card header
│   │       └── OAuthSection.tsx     # Google / WebAuthn buttons & divider
│   ├── vault/
│   │   ├── VaultPage.tsx            # Coordinator for vault dashboard
│   │   └── components/
│   │       ├── VaultHeader.tsx      # Title, search input, action buttons
│   │       ├── VaultSidebar.tsx     # Categories / filters (Logins, Cards, Notes)
│   │       └── VaultListContainer.tsx
│   ├── settings/
│   │   ├── SettingsPage.tsx
│   │   └── components/
│   │       ├── SecurityTab.tsx      # Change password, WebAuthn keys, auto-lock
│   │       ├── GeneralTab.tsx       # Theme, clipboard timeout
│   │       └── DangerZoneTab.tsx    # Delete account, wipe local cache
│   ├── setup/
│   │   ├── SetupPage.tsx
│   │   └── components/
│   │       ├── MasterPasswordStep.tsx
│   │       └── RecoveryKeyStep.tsx
│   └── unlock/
│       ├── UnlockPage.tsx
│       └── components/
│           ├── BiometricsPrompt.tsx
│           └── MasterPasswordUnlockForm.tsx
│
├── components/                      # Shared reusable UI
│   ├── ui/                          # Base design system primitives (Button, Dialog, Input, etc.)
│   ├── common/                      # Reusable cross-page composite widgets
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── ThemeToggle.tsx
│   │   ├── PasswordInput.tsx        # Reusable password input with show/hide & strength meter
│   │   ├── EmptyState.tsx           # Standard empty state graphic & call to action
│   │   └── LoadingOverlay.tsx       # Standard loading indicators
│   ├── auth/                        # Shared auth components (GoogleOAuthProvider, GoogleSignInButton)
│   └── vault/                       # Domain components shared across multiple views (ItemDialog, SecurityAudit, ImportBackupDialog)
│
├── hooks/                           # Reusable client hooks (useAutoLock, etc.)
├── lib/                             # Pure business logic, crypto, API client, Zustand stores
└── types/                           # Shared TypeScript definitions
```

---

## 3. Step-by-Step Execution Plan

### Phase 1: Shared Primitives & Common Components (`src/components/common/`)
- [ ] **PasswordInput (`PasswordInput.tsx`)**:
  - Extract the password visibility toggle and strength gauge (currently duplicated in Register, Reset Password, Setup, and Settings).
- [ ] **AuthCardWrapper (`AuthCardWrapper.tsx`)**:
  - Standardize authentication card shell, header with app icon/title, subtitle, and footer links.
- [ ] **Navbar & Navigation (`Navbar.tsx`, `Footer.tsx`)**:
  - Standardize common header elements and user profile/logout actions.

---

### Phase 2: Refactor Authentication Routes (`src/views/auth/`)
- [ ] Create `src/views/auth/LoginPage.tsx` and move login logic from `app/(auth)/login/page.tsx`.
- [ ] Create `src/views/auth/RegisterPage.tsx` and move register logic from `app/(auth)/register/page.tsx`.
- [ ] Create `src/views/auth/ForgotPasswordPage.tsx` and `ResetPasswordPage.tsx`.
- [ ] Update all `app/(auth)/**/page.tsx` routes to be 3-line wrapper components:
  ```tsx
  import { LoginPage } from "@/views/auth/LoginPage";

  export default function Page() {
    return <LoginPage />;
  }
  ```

---

### Phase 3: Refactor Vault Dashboard (`src/views/vault/`)
- [ ] Create `src/views/vault/VaultPage.tsx`.
- [ ] Split monolithic vault state into modular subcomponents:
  - `VaultHeader.tsx`: Search bar, lock vault button, export/import triggers, new item button.
  - `VaultSidebar.tsx`: Category selector (All, Logins, Cards, Notes), tags, and trash.
  - `VaultContent.tsx`: Coordinates empty states, loading skeletons, and list view.
- [ ] Simplify `app/app/vault/page.tsx` to mount `<VaultPage />`.

---

### Phase 4: Refactor Settings, Setup & Unlock Views
- [ ] **Settings (`src/views/settings/`)**:
  - Break `app/app/settings/page.tsx` (~324 lines) into:
    - `SecurityTab.tsx`: Master password changes, 2FA/WebAuthn registrations.
    - `PreferencesTab.tsx`: Theme switcher, auto-lock timeout settings.
    - `AccountTab.tsx` / `DangerZone.tsx`: Account deletion, export options.
- [ ] **Setup (`src/views/setup/`)**:
  - Split multi-step setup wizard into step subcomponents (`MasterPasswordStep.tsx`, `RecoveryKeyStep.tsx`).
- [ ] **Unlock (`src/views/unlock/`)**:
  - Decompose into `BiometricsUnlock.tsx` and `MasterPasswordUnlock.tsx`.

---

### Phase 5: Refactor Landing Page (`src/views/landing/`)
- [ ] Move sections from `app/page.tsx` into:
  - `HeroSection.tsx`
  - `FeaturesSection.tsx`
  - `SecurityArchitectureSection.tsx`
- [ ] Replace `app/page.tsx` with a clean wrapper rendering `<LandingPage />`.

---

### Phase 6: Verification & Validation
- [ ] Run `npm run build` to verify Turbo/Next compilation and check for missing imports or type errors.
- [ ] Run `npm run lint` to enforce clean lint standards.
- [ ] Verify that all client directives (`"use client"`) reside on interactive view components while route files remain clean.
