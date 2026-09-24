# Gupt Test Workflow

This document provides a step-by-step checklist to verify the core functionality of the Gupt application. Use this to ensure everything works correctly after making changes to the codebase.

## Prerequisites

- [x] Database is running (`docker compose up -d`)
- [x] Servers are running (`npm run dev` in the root directory)
- [x] Application is accessible at `http://localhost:3000`

---

## 1. Account Creation & Authentication

_Tests that the server can create a user and issue a session cookie without seeing the vault data._

- [x] Navigate to `http://localhost:3000`
- [x] Click **Sign up**
- [x] Enter a test email (e.g., `testuser@example.com`) and password (e.g., `ServerPassword123!`)
- [x] Click **Sign up**
- [x] Verify: Redirected to the `/app/setup` page

## 2. Cryptographic Vault Setup

_Tests the Argon2id key derivation and initial AES-GCM encryption._

- [x] On the "Setup Master Password" screen, enter a strong password (e.g., `MySuperSecretVaultKey99$`)
- [x] Confirm the Master Password
- [x] Click **Create Vault**
- [x] Verify: Redirected to the Vault Dashboard (`/app/vault`)

## 3. Vault CRUD Operations

_Tests that items can be encrypted, saved, decrypted, and modified._

### A. Create a Login Item

- [x] Click **New Item**
- [x] Leave type as `Login`
- [x] Fill in details (Title: `Netflix`, Username: `testuser@example.com`, Password: `WeakPassword1`, URL: `https://netflix.com`)
- [x] Click **Save**
- [x] Verify: "Netflix" appears in the vault list

### B. Create a Secure Note

- [x] Click **New Item**
- [x] Select the **Secure Note** tab
- [x] Fill in details (Title: `Router Config`, Note: `IP: 192.168.1.1\nAdmin: admin\nPass: admin123`)
- [x] Click **Save**
- [x] Verify: "Router Config" appears in the vault list

### C. Update & Password Generator

- [x] Click the **Edit** button next to the "Netflix" item
- [x] Click the **Generate** button (wand/refresh icon) next to the password field
- [x] Verify: Password field is filled with a strong, random string
- [x] Click **Save**

### D. Delete Item

- [x] Click the **Edit** button next to the "Router Config" item
- [x] Click the red **Delete Item** button at the bottom
- [x] Verify: "Router Config" is removed from the vault list

## 4. Security Features & Export

_Tests local data analysis, clipboard protection, and encrypted backups._

### A. Clipboard Protection

- [x] On the dashboard, click the **Copy** icon next to the Netflix password
- [x] Verify: A toast notification appears ("Password copied. Clipboard will clear in 30s.")
- [x] Wait 30 seconds and attempt to paste
- [x] Verify: Clipboard is cleared (or contains previous non-sensitive content)

### B. Security Audit

- [x] Check the **Security Audit** section at the top of the dashboard
- [x] Verify: It accurately reflects the state of your passwords (e.g., 0 Weak Passwords if you used the generator)
- [x] Create a temporary item with the password `12345`
- [x] Verify: "Weak Passwords" count updates to `1`

### C. Encrypted Export

- [x] Click the **Export** button in the top header
- [x] Verify: A file named `gupt-vault-backup-YYYY-MM-DD.json` downloads
- [x] Open the file in a text editor
- [x] Verify: The file contains JSON with `"algorithm": "AES-256-GCM"`, `"salt"`, `"iv"`, and a Base64 `"ciphertext"`. No plaintext passwords or titles should be visible.

## 5. Lock, Unlock & Sync

_Tests that memory is cleared on lock, and that the Master Password can successfully decrypt the server's payload._

### A. Lock the Vault

- [x] Click **Lock & Sign Out** in the top header
- [x] Verify: Redirected to the home page. The decrypted vault is cleared from memory.

### B. Log Back In

- [ ] Click **Login**
- [ ] Enter your account credentials (`testuser@example.com` / `ServerPassword123!`)
- [ ] Click **Sign in**
- [ ] Verify: Redirected to the `/app/unlock` screen

### C. Unlock the Vault

- [x] Enter an incorrect Master Password (e.g., `WrongPassword`)
- [x] Click **Unlock**
- [x] Verify: Error message "Invalid Master Password" appears
- [x] Enter the correct Master Password (`MySuperSecretVaultKey99$`)
- [x] Click **Unlock**
- [x] Verify: Redirected to the dashboard, and your items are visible again

## 6. WebAuthn / Passkeys (Optional)

_Tests the passwordless login flow, passkey listing, and management._

- [x] Click **Settings** in the top header
- [x] With zero passkeys registered: Verify "No passkeys registered yet." message is displayed.
- [x] Click **Register New Passkey**
- [x] Follow the OS prompt to register (TouchID, FaceID, Windows Hello, etc.)
- [x] Verify: New passkey appears in the list with calculated server label (e.g. "This device" / "Synced passkey" / "Security key") and registration date.
- [x] (Optional) Register a second passkey: Verify list displays both passkeys sorted with newest first.
- [x] Delete passkey verification:
  - Click the trash icon next to a passkey: A confirmation modal appears.
  - Confirm delete: Passkey is removed and list refreshes.
  - Delete lockout guard check: For an account without password and without Google OAuth, deleting the sole remaining passkey is blocked with an error message instructing the user to add another sign-in method first.
- [x] Click **Lock & Sign Out**
- [x] Go to the **Login** page
- [x] Enter your email (`testuser@example.com`)
- [x] Click the **Passkey** button
- [x] Follow the OS prompt for biometrics
- [x] Verify: Successfully logged in and taken to the `/app/unlock` screen (Master Password is still required to decrypt the vault)

