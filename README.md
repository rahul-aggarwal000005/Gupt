# Gupt

A security-first personal password and secrets manager built initially as a web application, with a mobile application planned to use the same backend APIs and encrypted vault format.

The project is initially intended for personal use and a small group of trusted friends. The architecture should remain clean and extensible so it can later evolve into a larger product if it proves useful.

---

## 1. Core Product Idea

SecureVault allows users to securely store:

- Website/app usernames and passwords
- PINs
- Secure notes
- Recovery/backup codes
- Wi-Fi credentials
- TOTP/2FA secrets
- Other personal secrets

The most important principle is:

> **The backend must never be able to read a user's vault secrets.**

The client encrypts sensitive vault data before sending it to the server.

The server stores encrypted data and provides authentication, synchronization, versioning, and session management.

---

# 2. Architecture

Use a simple two-part repository structure:

```text
secure-vault/
│
├── client/
│   ├── web/
│   │
│   └── mobile/
│       # Planned for a later phase
│
├── server/
│
├── docs/
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

### Client

The client is responsible for:

- UI
- Vault encryption/decryption
- Password generation
- Local vault handling
- Search
- Security audit
- Biometric authentication where supported
- Calling the backend API

### Server

The server is responsible for:

- Account authentication
- User management
- Sessions/tokens
- Encrypted vault synchronization
- Vault versioning
- Device/session management
- Rate limiting
- API validation
- Database access

### Critical rule

The server must NEVER decrypt the user's vault.

```text
                    SECUREVAULT

             ┌──────────────────────┐
             │       CLIENT         │
             │                      │
             │ Master Password      │
             │ Key Derivation       │
             │ Encryption           │
             │ Decryption           │
             │ Vault                │
             └──────────┬───────────┘
                        │
                  HTTPS / REST
                        │
                        ▼
             ┌──────────────────────┐
             │       SERVER         │
             │                      │
             │ Authentication       │
             │ Encrypted Vault      │
             │ Sync                 │
             │ Sessions             │
             │ Versioning           │
             └──────────┬───────────┘
                        │
                        ▼
                   PostgreSQL
```

---

# 3. Technology Stack

## Web Client

Use:

- Next.js
- TypeScript
- Tailwind CSS
- React Hook Form
- Zod
- Web Crypto API
- WebAuthn where appropriate

Use the latest stable versions that are compatible with each other.

## Backend

Use:

- Node.js
- TypeScript
- Express
- PostgreSQL
- Prisma
- REST API
- Argon2id where password hashing/key derivation is required
- Helmet/security middleware
- API rate limiting
- DTO validation
- Secure HTTP headers

## Development

Use:

- Docker Compose
- PostgreSQL
- Environment variables
- ESLint
- Prettier
- Unit tests
- Integration tests
- API tests

## Future Mobile Client

Planned:

- React Native
- TypeScript
- Same backend REST API
- Same encrypted vault format
- iOS Keychain/Secure Enclave where appropriate
- Android Keystore
- Face ID / Touch ID / Android Biometrics

Do not build the mobile application in V1 unless specifically requested.

---

# 4. Security Requirements

Security is the most important part of this project.

Do not sacrifice security for convenience.

## 4.1 Zero-Knowledge Vault

The backend must never receive:

- Master password
- Vault encryption key
- Plaintext passwords
- PINs
- Secure notes
- TOTP secrets
- Recovery codes

The backend may store:

- User ID
- Email
- Phone number if implemented
- Authentication metadata
- Encrypted vault
- Vault version
- Device/session metadata
- Timestamps

---

# 5. Encryption Architecture

Use established cryptographic libraries and browser/native cryptographic APIs.

Never invent custom cryptography.

Recommended conceptual architecture:

```text
Master Password
       │
       ▼
   Argon2id KDF
       │
       ▼
Key Encryption Key
       │
       ▼
Vault Encryption Key
       │
       ▼
Authenticated Encryption
       │
       ▼
Encrypted Vault
```

Use an authenticated encryption algorithm such as:

- AES-256-GCM

or another well-reviewed modern AEAD algorithm supported reliably by the target platforms.

Every encryption operation must use a unique random nonce/IV as required by the chosen algorithm.

Include a version number in the encrypted payload so cryptographic migrations are possible later.

Example conceptual structure:

```json
{
  "version": 1,
  "algorithm": "AES-256-GCM",
  "kdf": "Argon2id",
  "kdfParams": {},
  "salt": "...",
  "nonce": "...",
  "ciphertext": "...",
  "authTag": "..."
}
```

Do not blindly copy these parameters. Select and document secure parameters appropriate for the platform.

---

# 6. Master Password

The master password is the user's primary vault secret.

Requirements:

- Never send it to the server.
- Never log it.
- Never store it in plaintext.
- Never store it in localStorage.
- Never store it in AsyncStorage.
- Never send it to analytics.
- Never include it in error messages.
- Never include it in URLs or query parameters.

Use Argon2id for secure key derivation.

Prefer encouraging long passphrases over arbitrary complexity rules.

---

# 7. Authentication vs Vault Unlock

These are separate concepts.

## Account Authentication

Used for:

- Creating an account
- Logging into the service
- Synchronizing encrypted vault data
- Managing sessions/devices

## Vault Authentication

Used for:

- Unlocking/decrypting the user's vault

The user can have a valid server session while the vault remains locked.

Example:

```text
Application starts
       │
       ▼
Restore account session
       │
       ▼
Vault is LOCKED
       │
       ▼
Master Password / Biometric
       │
       ▼
Vault is UNLOCKED
```

Do not use server authentication as the vault encryption key.

---

# 8. Biometric Authentication

Do NOT implement custom face recognition.

Do NOT store fingerprint or face data.

Use platform security APIs.

For the web:

- WebAuthn/passkeys where appropriate.

For future mobile:

- iOS Face ID / Touch ID
- iOS Keychain/Secure Enclave
- Android BiometricPrompt
- Android Keystore

Biometrics should authorize access to a securely protected key rather than being treated as a replacement for cryptographic protection.

---

# 9. OTP and Recovery

Email/SMS OTP may be used for:

- Email verification
- Account recovery
- Account security

OTP must NOT be treated as the vault encryption key.

A forgotten master password must not automatically allow the server to decrypt the vault.

If a recovery-key mechanism is implemented, it must be designed so that the user can recover the encrypted vault key without giving the backend plaintext access.

If the user loses both the master password and recovery mechanism, it is acceptable for the vault to become unrecoverable.

Security must not be weakened to guarantee recovery.

---

# 10. Vault Data Model

Vault items should support multiple types.

Supported V1 types:

- login
- secure_note
- pin
- wifi
- recovery_code
- totp
- custom

Example login item:

```json
{
  "id": "uuid",
  "type": "login",
  "title": "Gmail",
  "username": "user@example.com",
  "password": "secret",
  "url": "https://gmail.com",
  "notes": "",
  "tags": ["email", "personal"],
  "favorite": false,
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedAt": "2026-01-01T00:00:00Z"
}
```

All sensitive fields belong inside the encrypted vault.

The backend must not receive individual plaintext fields such as:

```text
password
pin
notes
totpSecret
recoveryCodes
```

Instead the client sends encrypted vault data.

---

# 11. Local Storage

Never store plaintext secrets in:

- localStorage
- sessionStorage
- AsyncStorage
- Redux persistence
- Zustand persistence
- cookies
- URLs
- analytics
- crash reports
- console logs

For the web client:

- Use browser cryptographic APIs.
- Store only what is necessary locally.
- Keep decrypted vault data in memory only while unlocked.
- Clear/lock the vault when the app is locked.
- Use secure browser storage only for appropriate non-secret session information.

For mobile:

- Use platform secure storage/keychain/keystore.

If a local database is introduced, sensitive vault content must remain encrypted.

---

# 12. Auto Lock

Implement configurable auto-lock:

- Immediately
- 30 seconds
- 1 minute
- 5 minutes
- 15 minutes

Optional:

- Never

Recommended default:

- 5 minutes

Lock when:

- The user manually locks the vault.
- The inactivity timeout expires.
- The browser/tab loses focus for a configured security period where practical.
- The application is closed.

When locking:

- Remove decrypted vault data from application state as much as practical.
- Hide sensitive UI.
- Require vault unlock again.

---

# 13. Clipboard Protection

When a user copies a password/PIN:

- Copy only on explicit user action.
- Never log clipboard contents.
- Clear clipboard after a short configurable period where supported.
- Show a clear confirmation.

Example:

```text
Password copied.
Clipboard will be cleared shortly.
```

---

# 14. Password Generator

Create a cryptographically secure password generator.

Never use:

```javascript
Math.random();
```

for security-sensitive random generation.

Use a cryptographically secure random source.

Options:

- Length
- Uppercase
- Lowercase
- Numbers
- Symbols
- Passphrase mode

Example defaults:

```text
Length: 20
Uppercase: ON
Lowercase: ON
Numbers: ON
Symbols: ON
```

Allow users to customize these.

---

# 15. Security Audit

The audit must run locally.

Never send plaintext passwords to the server for analysis.

Detect:

- Weak passwords
- Reused passwords
- Empty passwords
- Duplicate credentials
- Old passwords
- Missing URLs
- Missing usernames

Example:

```text
Security Audit

Strong passwords       18
Weak passwords          2
Reused passwords        3
Old passwords           4
```

Use neutral security indicators rather than exposing passwords unnecessarily.

---

# 16. Search

Search should run locally.

The backend must not receive plaintext search queries containing vault secrets.

The user should be able to search:

- Title
- Username
- URL
- Tags
- Category

Search results should not expose passwords directly.

---

# 17. Vault Synchronization

The server stores encrypted vault data.

Initial V1 implementation can use encrypted full-vault snapshots.

```text
Client
   │
   │ Encrypt vault
   ▼
Encrypted payload
   │
   │ HTTPS
   ▼
Server
   │
   ▼
PostgreSQL
```

The server should never inspect the ciphertext contents.

---

# 18. Vault Versioning

Every vault update must have a version.

Example:

```text
Device A → version 10
Device B → version 10

Device A uploads → version 11

Device B attempts upload based on version 10
```

The server must reject stale writes.

Example:

```json
{
  "error": "VAULT_VERSION_CONFLICT",
  "serverVersion": 11
}
```

Never silently overwrite a newer vault.

V1 can provide a clear conflict resolution flow rather than implementing a complex automatic merge.

---

# 19. Backend Database

Use PostgreSQL + Prisma.

Suggested tables:

```text
User
Session
Device
Vault
```

Example conceptual Vault model:

```text
Vault
-----
id
userId
version
encryptedData
createdAt
updatedAt
```

The encryptedData column contains ciphertext only.

Do not add columns such as:

```text
gmailPassword
bankPin
instagramPassword
```

---

# 20. Backend Modules

Use Express routers/controllers structured by feature:

```text
server/src/

auth/
users/
sessions/
devices/
vault/
health/
common/
```

Potential future modules:

```text
notifications/
sharing/
organizations/
subscriptions/
audit/
```

Do not implement future modules unless needed.

---

# 21. API

Use REST APIs.

Authentication:

```text
POST /auth/register
POST /auth/login
POST /auth/logout
POST /auth/refresh
POST /auth/verify-email
POST /auth/request-password-reset
POST /auth/reset-password
```

Vault:

```text
GET /vault
PUT /vault
GET /vault/version
```

Sessions/devices:

```text
GET /sessions
DELETE /sessions/:id

GET /devices
DELETE /devices/:id
```

Health:

```text
GET /health
```

---

# 22. Vault API Example

Request:

```http
PUT /vault
Authorization: Bearer <access-token>
Content-Type: application/json
```

Body:

```json
{
  "version": 12,
  "encryptedVault": {
    "algorithm": "AES-256-GCM",
    "keyVersion": 1,
    "nonce": "...",
    "ciphertext": "...",
    "authTag": "..."
  }
}
```

The backend should validate:

- Authentication
- Ownership
- Payload structure
- Version
- Size limits

The backend must not decrypt the payload.

---

# 23. API Security

Implement:

- HTTPS in production
- CORS configuration
- Helmet
- Rate limiting
- DTO validation
- Request body size limits
- Secure cookies if cookies are used
- Short-lived access tokens
- Refresh token rotation where appropriate
- Session revocation
- Device/session tracking
- Brute-force protection
- Consistent error responses
- Secret redaction in logs

Never log:

- Passwords
- Tokens
- Vault ciphertext if avoidable
- Encryption keys
- OTP values
- Recovery codes

---

# 24. Web Application Pages

Create a polished, simple UI.

## Public

```text
/
 /login
 /register
 /verify-email
 /forgot-password
 /reset-password
```

## Authenticated

```text
/app
/app/vault
/app/vault/new
/app/vault/:id
/app/security
/app/settings
/app/devices
```

---

# 25. Web UI

The UI should feel like a modern password manager.

Main layout:

```text
┌─────────────────────────────────────────────┐
│ SecureVault                    🔒 Locked    │
├───────────────┬─────────────────────────────┤
│ Vault         │                             │
│ Favorites     │       Vault Items           │
│ Security      │                             │
│ Settings      │       Search                │
│               │                             │
│               │       Items                 │
└───────────────┴─────────────────────────────┘
```

Features:

- Dark/light mode
- Responsive design
- Keyboard accessible
- Mobile-friendly web layout
- Clear lock state
- Password visibility toggle
- Copy buttons
- Search
- Favorites
- Categories
- Empty states
- Confirmation dialogs
- Toast notifications
- Loading states
- Error states

Avoid visual clutter.

---

# 26. UX Security Rules

Do not accidentally expose secrets.

Examples:

- Password fields hidden by default.
- PINs hidden by default.
- Secure notes hidden until item is opened.
- Avoid displaying passwords in notifications.
- Avoid putting sensitive information in browser URLs.
- Avoid rendering secrets in page titles.
- Avoid screenshots containing secrets where preventable.
- Confirm destructive actions.
- Make lock/unlock state obvious.

---

# 27. Project Folder Structure

Use:

```text
secure-vault/
│
├── client/
│   │
│   ├── web/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── features/
│   │   │   │   ├── auth/
│   │   │   │   ├── vault/
│   │   │   │   ├── security/
│   │   │   │   └── settings/
│   │   │   ├── lib/
│   │   │   │   ├── api/
│   │   │   │   ├── crypto/
│   │   │   │   ├── storage/
│   │   │   │   └── validation/
│   │   │   └── types/
│   │   ├── public/
│   │   └── package.json
│   │
│   └── mobile/
│       # Planned
│
├── server/
│   ├── src/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── sessions/
│   │   ├── devices/
│   │   ├── vault/
│   │   ├── health/
│   │   └── common/
│   ├── prisma/
│   └── package.json
│
├── docs/
│   ├── architecture.md
│   ├── security.md
│   └── api.md
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

The exact folder structure may be adjusted if the framework requires it, but preserve the separation between client and server.

---

# 28. Environment Variables

Create:

```text
.env.example
```

Never commit real secrets.

Example:

```env
DATABASE_URL=
JWT_SECRET=
JWT_REFRESH_SECRET=
APP_URL=
API_URL=
NODE_ENV=development
```

For production, use a proper secrets manager or environment secret storage.

---

# 29. Docker

Create a development `docker-compose.yml`.

At minimum:

```text
PostgreSQL
```

The application itself may run locally during development.

Provide commands such as:

```bash
docker compose up -d
```

and:

```bash
docker compose down
```

---

# 30. Testing

Security-sensitive code must have tests.

## Backend

Test:

- Registration
- Login
- Token refresh
- Logout
- Session revocation
- Vault creation
- Vault update
- Version conflicts
- Unauthorized access
- User isolation
- Rate limiting
- Validation

## Client

Test:

- Encryption/decryption round trip
- Wrong password fails
- Tampered ciphertext fails
- Password generator
- Vault CRUD
- Lock/unlock
- Security audit
- Search
- Import/export if implemented

Example crypto test:

```text
plaintext
   ↓
encrypt
   ↓
ciphertext
   ↓
decrypt
   ↓
same plaintext
```

Also test:

```text
ciphertext modified
      ↓
decryption fails
```

---

# 31. Threat Model

Document the following threats:

1. Database leak
2. Stolen access token
3. Compromised account password
4. Malicious server/database administrator
5. Network attacker
6. XSS
7. CSRF where relevant
8. Brute-force login attempts
9. Device theft
10. Malicious browser extension
11. Clipboard leakage
12. Accidental application logging
13. Lost master password
14. Vault synchronization conflicts

The architecture should clearly state which threats are mitigated and which are outside the application's control.

---

# 32. Important Web Security Limitation

A browser-based password manager has a fundamental limitation:

If the user's browser/device is compromised by malware, a malicious browser extension, keylogger, or injected JavaScript, secrets can potentially be exposed while the vault is unlocked.

Do not claim that encryption makes the application immune to a compromised endpoint.

Design the application to minimize exposure, but document this limitation.

---

# 33. Error Handling

Never expose sensitive internal details.

Bad:

```text
Argon2 key = abc123...
```

Bad:

```text
Password "mypassword123" is invalid.
```

Good:

```text
Unable to unlock vault.
```

Good:

```text
Invalid credentials.
```

Use structured error codes internally while keeping user-facing messages safe.

---

# 34. Logging

Use structured logging.

Logs must be safe to share during debugging.

Never log:

- Passwords
- PINs
- Master password
- Encryption keys
- Access tokens
- Refresh tokens
- OTPs
- Recovery codes
- Plaintext vault contents

Create a redaction utility and use it consistently.

---

# 35. Account Deletion

Implement account deletion carefully.

The server should delete:

- User account
- Encrypted vault
- Sessions
- Devices

Clearly warn the user before deletion.

If a local encrypted vault remains on the device, provide a secure local wipe/delete option.

---

# 36. Backup / Export

Implement encrypted backup/export.

The exported file must contain encrypted vault data.

Never export:

```text
passwords.txt
vault.json
```

containing plaintext secrets.

A backup should remain encrypted outside the application.

Example:

```text
SecureVault Backup
        ↓
Encrypted file
        ↓
User chooses storage location
```

Import should require the appropriate unlock/recovery credentials.

---

# 37. Development Phases

## Phase 1 — Project Foundation

Build:

- Repository structure
- Web client
- Express server
- PostgreSQL
- Prisma
- Docker
- Environment configuration
- Health endpoint
- Basic API client
- Basic UI shell

Acceptance criteria:

- Client runs
- Server runs
- Database connects
- Health endpoint works
- Basic CI-quality lint/typecheck commands work

---

## Phase 2 — Authentication

Build:

- Registration
- Login
- Logout
- Refresh session
- Email verification architecture
- Password reset architecture
- Session management

Acceptance criteria:

- User can register
- User can login
- Unauthorized API calls are rejected
- Sessions can be revoked
- No plaintext passwords are stored

---

## Phase 3 — Cryptographic Vault

Build:

- Master password setup
- Argon2id key derivation
- Vault encryption
- Vault decryption
- Authentication/integrity checks
- Vault lock/unlock
- Encrypted local state

Acceptance criteria:

- Correct password unlocks vault
- Wrong password fails
- Modified ciphertext fails
- Server never receives plaintext vault contents
- Encryption/decryption tests pass

---

## Phase 4 — Vault CRUD

Build:

- Create item
- Read item
- Update item
- Delete item
- Categories
- Favorites
- Tags
- Search
- Password visibility

Acceptance criteria:

- User can manage all supported item types
- Secrets remain encrypted
- Search works locally

---

## Phase 5 — Security Features

Build:

- Password generator
- Security audit
- Auto-lock
- Clipboard clearing
- Secure session handling
- Device/session management
- Security settings

---

## Phase 6 — Cloud Sync

Build:

- Upload encrypted vault
- Download encrypted vault
- Versioning
- Conflict detection
- Conflict resolution
- Encrypted backup

Acceptance criteria:

- Multiple browser sessions can sync
- Stale updates are rejected
- No plaintext vault data reaches the server

---

## Phase 7 — WebAuthn/Biometrics

Implement appropriate web authentication mechanisms.

Do not claim that browser WebAuthn is identical to native Face ID/fingerprint unlocking.

The web implementation should use standards-supported authentication capabilities.

---

## Phase 8 — Mobile

After the web application is stable:

```text
client/
├── web/
└── mobile/
```

Build React Native mobile app using:

- Same backend API
- Same account system
- Same vault format
- Native secure key storage
- Native biometrics

---

# 38. Cursor Instructions

You are the implementation agent for this project.

Follow these rules:

### Rule 1

Do not implement insecure shortcuts just to make a feature work.

If a requirement conflicts with secure architecture, stop and document the issue before choosing a weaker implementation.

### Rule 2

Never invent cryptography.

Use established libraries and platform APIs.

### Rule 3

Never store secrets in logs.

### Rule 4

Never send plaintext vault secrets to the backend.

### Rule 5

Do not put secrets in URLs.

### Rule 6

Do not use `Math.random()` for security-sensitive values.

### Rule 7

Use TypeScript strictly.

Avoid `any` unless there is a documented reason.

### Rule 8

Validate all server inputs.

### Rule 9

Write tests for security-critical functionality.

### Rule 10

Do not build the mobile app during the initial web implementation.

Prepare the architecture so it can be added later.

---

# 39. Cursor Development Workflow

Do not generate the entire project blindly in one step.

Work in phases.

For each phase:

1. Inspect the existing repository.
2. Create/update the required files.
3. Implement the feature.
4. Run type checking.
5. Run linting.
6. Run tests.
7. Fix errors.
8. Update documentation.
9. Summarize what changed.
10. Move to the next phase only when the current phase works.

Do not replace working code unnecessarily.

Do not make unrelated changes.

---

# 40. Definition of Done

The project is considered V1 complete when:

- User can register/login.
- User can create a vault.
- User can unlock the vault using the master password.
- Vault data is encrypted client-side.
- Server stores ciphertext only.
- User can add login credentials.
- User can add secure notes.
- User can add PINs.
- User can add recovery codes.
- User can add TOTP secrets.
- User can search vault locally.
- User can generate strong passwords.
- User can run a local security audit.
- Auto-lock works.
- Clipboard protection works where supported.
- Encrypted vault synchronization works.
- Version conflicts are handled safely.
- Sessions can be revoked.
- Encrypted backup/export works.
- Tests cover critical security functionality.
- No secrets appear in logs.
- Documentation explains the security model and limitations.

---

# 41. Important Product Philosophy

This is a personal/friends project first.

Prioritize:

```text
Security
   ↓
Correctness
   ↓
Reliability
   ↓
Usability
   ↓
Features
```

Do not prioritize feature count over security.

A smaller password manager that correctly protects ten secrets is better than a feature-rich password manager with an insecure encryption architecture.

---

# 42. Future Features

Do not implement these yet, but keep the architecture extensible:

- React Native mobile app
- Native biometric unlock
- Browser extension
- Browser autofill
- Encrypted sharing
- Family vaults
- Multiple vaults
- Emergency access
- Secure password sharing
- Passkey storage
- Import from other password managers
- Breach monitoring
- TOTP QR-code scanning
- Organizations
- Subscription/billing
- Advanced device management

---

# 43. Final Architecture

The intended long-term structure is:

```text
                         SECUREVAULT
                             │
                ┌────────────┴────────────┐
                │                         │
              CLIENT                    SERVER
                │                         │
        ┌───────┴────────┐                │
        │                │                │
       WEB             MOBILE             │
        │                │                │
        │                │                │
        └───────┬────────┘                │
                │                         │
                │       HTTPS             │
                └──────────┬──────────────┘
                           │
                           ▼
                    Express REST API
                           │
                           ▼
                       PostgreSQL

Client responsibilities:
- Encryption
- Decryption
- Vault
- Search
- Password generation
- Security audit
- Local protection

Server responsibilities:
- Authentication
- Sessions
- User management
- Encrypted vault storage
- Synchronization
- Versioning
- Device management

Server must never:
- Decrypt vault
- See master password
- See individual passwords
- See PINs
- See secure notes
- See TOTP secrets
```

---

# 44. Start Here

Begin with **Phase 1 only**.

Do not implement all future phases in the first pass.

First create:

```text
secure-vault/
├── client/
│   └── web/
├── server/
├── docs/
├── docker-compose.yml
├── .gitignore
└── README.md
```

Then set up:

- Next.js web client
- Express server
- PostgreSQL
- Prisma
- Docker Compose
- Environment configuration
- Health endpoint
- Basic API client
- Basic responsive application shell

After Phase 1 is working, proceed to authentication.

Before implementing cryptography, explicitly document the chosen cryptographic libraries, algorithms, key hierarchy, storage strategy, and threat model.

Do not proceed with an insecure custom cryptographic implementation.
