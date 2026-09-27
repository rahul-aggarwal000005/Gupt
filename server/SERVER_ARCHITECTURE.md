# Gupt Server Architecture & Request Lifecycle

A complete architectural and flow reference for the backend API service located in `server/`.

---

## 1. High-Level Architecture Overview

The Gupt backend is built with **Node.js, Express, TypeScript, and Prisma ORM** connected to PostgreSQL. It is designed around a **Zero-Knowledge Security Model**: the server acts as an encrypted blob store and authentication gateway, but **never** has access to master passwords, vault encryption keys, or unencrypted vault items.

```
                          ┌───────────────────────────┐
                          │    Next.js Web Client     │
                          │   (Zero-Knowledge Host)   │
                          └─────────────┬─────────────┘
                                        │ HTTP / JSON / Cookies
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Express Server (Port 3001)                        │
│                                                                             │
│  [Global Middleware] Helmet -> CORS -> express.json() -> cookieParser()     │
│                                                                             │
│  ┌─────────────────────────────┐           ┌─────────────────────────────┐  │
│  │   /api/auth Routes          │           │   /api/vault Routes         │  │
│  ├─────────────────────────────┤           ├─────────────────────────────┤  │
│  │ - Email/Password Auth       │           │ - GET  / (Get Encrypted)    │  │
│  │ - Google OAuth              │           │ - PUT  / (Optimistic Update)│  │
│  │ - WebAuthn / Passkeys       │           └──────────────┬──────────────┘  │
│  │ - Password Reset Tokens     │                          │                 │
│  └──────────────┬──────────────┘                          │                 │
│                 │                                         │                 │
│                 ▼                                         ▼                 │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                   Authentication Middleware                           │  │
│  │    Verify JWT Cookie -> Validate DB Session -> Attach req.user        │  │
│  └──────────────────────────────────┬────────────────────────────────────┘  │
│                                     │                                       │
│                                     ▼                                       │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                      Prisma ORM Client (@prisma/client)               │  │
│  └──────────────────────────────────┬────────────────────────────────────┘  │
└─────────────────────────────────────┼───────────────────────────────────────┘
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │   PostgreSQL Database     │
                        │  (Users, Vaults, Sessions,│
                        │   Passkeys, Resets)       │
                        └───────────────────────────┘
```

---

## 2. Directory & Component Structure

```
server/
├── prisma/
│   ├── schema.prisma              # Database schema definitions & relations
│   └── migrations/                # Version-controlled SQL migration files
├── src/
│   ├── index.ts                   # Express server entrypoint, middleware, and route mounting
│   ├── env.ts                     # Environment variable validation and loading
│   ├── prisma.ts                  # Shared PrismaClient singleton instance
│   ├── middleware/
│   │   └── auth.middleware.ts     # JWT + database session verification middleware
│   ├── routes/
│   │   ├── auth.routes.ts         # Routes for credentials, Google OAuth, and WebAuthn
│   │   └── vault.routes.ts        # Authenticated vault retrieval and versioned sync routes
│   ├── controllers/
│   │   ├── auth.controller.ts     # Email registration, login, logout, password resets
│   │   ├── google-auth.controller.ts # Google token verification & user provisioning
│   │   ├── webauthn.controller.ts # Passkey registration, login, verification, and listing
│   │   └── vault.controller.ts    # Optimistic concurrency vault CRUD operations
│   ├── services/
│   │   ├── email.service.ts       # Nodemailer integration for password reset emails
│   │   └── google-auth.service.ts # Google OAuth2 client token validation
│   └── utils/
│       ├── jwt.ts                 # JWT signing and verification helpers
│       └── passkey-display.ts     # User-agent parsing & heuristic passkey labeling
```

---

## 3. Database Schema & Data Models

Defined in [`prisma/schema.prisma`](prisma/schema.prisma):

```
┌─────────────────────────────────┐
│              User               │
├─────────────────────────────────┤
│ id: String (UUID, PK)           │
│ email: String (Unique)          │
│ passwordHash: String?           │
│ currentChallenge: String?       │
│ googleId: String? (Unique)      │
│ name: String?                   │
│ avatarUrl: String?              │
│ createdAt: DateTime             │
│ updatedAt: DateTime             │
└───────┬──────────┬────────┬─────┘
        │ 1:1      │ 1:N    │ 1:N
        ▼          ▼        ▼
┌──────────────┐ ┌─────────┐ ┌──────────────┐
│    Vault     │ │ Session │ │   Passkey    │
├──────────────┤ ├─────────┤ ├──────────────┤
│ userId (UQ)  │ │ id (PK) │ │ id (PK)      │
│ version: Int │ │ token   │ │ credentialID │
│ encryptedData│ │ expires │ │ publicKey    │
│ (AES-GCM     │ │ userId  │ │ counter      │
│  Ciphertext) │ └─────────┘ │ userId       │
└──────────────┘             └──────────────┘
```

1. **`User`**: Core identity entity. Supports multiple authentication mechanisms concurrently (password, Google OAuth, Passkeys).
2. **`Session`**: Stateful session record. Validated on every authenticated request alongside the stateless JWT.
3. **`Vault`**: Stores the user's encrypted envelope. Contains **no plaintext**. `version` tracks optimistic concurrency to resolve client conflicts.
4. **`Passkey`**: FIDO2 / WebAuthn credentials stored as raw public key buffers, counter tracking for clone detection, and metadata flags.
5. **`PasswordReset`**: Single-use, time-limited cryptographic tokens for password reset workflows.

---

## 4. End-to-End Execution Flows

### 4.1 Authentication & Session Lifecycle

```
Client                             Server                           PostgreSQL
  │                                   │                                  │
  ├────── POST /api/auth/login ──────>│                                  │
  │      { email, password }          ├───── Find user by email ────────>│
  │                                   │<──── Return User record ─────────┤
  │                                   ├───── bcrypt.compare(pass, hash)  │
  │                                   ├───── Create Session (7d expiry) ─>│
  │                                   │<──── Session created ────────────┤
  │                                   ├───── signToken({ userId, sId })  │
  │<───── Set HttpOnly Cookie ────────┤                                  │
  │      { user: { id, email } }      │                                  │
```

1. Client sends credentials or Google ID token or WebAuthn assertion.
2. Server validates authentication credentials.
3. Server creates a `Session` record in the database with a 7-day expiration.
4. Server generates a signed JWT payload `{ userId, sessionId }`.
5. Server writes the JWT into an `HttpOnly`, `Secure` (in prod), `SameSite` cookie named `token`.

### 4.2 Authenticated Request Lifecycle (`authenticate` Middleware)

```
Incoming Request
       │
       ▼
Extract `req.cookies.token`
       │
       ├─► Missing Token? ───────► Return 401 Unauthorized
       │
       ▼
Verify JWT Signature via `verifyToken(token)`
       │
       ├─► Invalid / Expired? ───► Return 401 Unauthorized
       │
       ▼
Query DB for Session: `prisma.session.findUnique({ id: decoded.sessionId })`
       │
       ├─► Session missing OR session.expiresAt < now()? ──► Return 401 Unauthorized
       │
       ▼
Attach Context:
  req.user = { id: session.user.id, email: session.user.email }
  req.sessionId = session.id
       │
       ▼
next() -> Pass control to Route Controller
```

---

### 4.3 Vault Synchronization & Optimistic Concurrency Control

The server acts as a versioned conflict detector using optimistic concurrency control:

```
Client (Has version V)               Server                       PostgreSQL
  │                                     │                              │
  ├───── PUT /api/vault ───────────────>│                              │
  │     { version: V, encryptedData }   ├──── Find Vault by userId ───>│
  │                                     │<─── Existing Vault (ver: S) ─┤
  │                                     │                              │
  │                                     ├──── Version Check:           │
  │                                     │     Is V === S?              │
  │                                     │                              │
  │  ┌─────────────── MATCH ────────────┴───────────── CONFLICT ─────┐ │
  │  ▼                                                               ▼ │
  │ Update vault in DB (ver: S + 1)                 Reject request:    │
  │ prisma.vault.update({ version: S + 1 })         Return 409:        │
  │ Return 200 { version: S + 1 }                   {                  │
  │                                                   error:           │
  │                                                    'CONFLICT',     │
  │                                                   serverVersion: S │
  │                                                 }                  │
```

- If `clientVersion === serverVersion`: Vault ciphertext is updated, server increments version to `serverVersion + 1`, and returns `200 OK`.
- If `clientVersion !== serverVersion`: Another device synced in the meantime. The server immediately returns `409 VAULT_VERSION_CONFLICT`. The client must fetch the server ciphertext, decrypt, merge, and retry.

---

### 4.4 WebAuthn / Passkey Authentication Flow

1. **Registration Options**: Authenticated user calls `/api/auth/webauthn/register/generate-options`. Server generates a cryptographic challenge via `@simplewebauthn/server` and temporarily saves it in `user.currentChallenge`.
2. **Registration Verification**: Browser creates credential with hardware authenticator (TouchID / FaceID / YubiKey) and posts response to `/api/auth/webauthn/register/verify`. Server verifies signature against saved challenge, parses device heuristics (`passkeyDisplay`), and persists `Passkey` record.
3. **Passwordless Login**:
   - Client calls `/api/auth/webauthn/login/generate-options?email=...`. Server issues challenge.
   - Client calls `/api/auth/webauthn/login/verify` with assertion response. Server verifies counter (anti-replay/clone protection), creates a new `Session`, and sets the auth cookie.

---

## 5. Security Architecture Summary

1. **Zero-Knowledge Principle**: Plaintext passwords, secure notes, and encryption keys are never transmitted to or processed by the server. Only AES-256-GCM ciphertexts are received and stored.
2. **Double-Layer Session Invalidation**: Even though JWTs are stateless, every request verifies the underlying database `Session`. When a user clicks "Logout", the session is deleted from the DB, instantly invalidating the JWT across all instances without waiting for JWT expiration.
3. **Cookie Hardening**:
   - `httpOnly: true` (inaccessible to JavaScript / XSS scripts).
   - `secure: true` in production (transmitted only over HTTPS).
   - `sameSite: "none"` (prod) / `"lax"` (dev) with strict CORS whitelist for `process.env.APP_URL`.
4. **Input Validation**: All incoming request payloads are strictly validated using **Zod** schemas before reaching database operations.
