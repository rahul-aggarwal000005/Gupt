# SERVER CODE DEEP DIVE: The Complete Backend Learning Guide for Gupt Vault

Welcome to the definitive learning guide for the Gupt Vault backend service (`server/`).

This guide is designed as an intensive, foundational-to-advanced backend engineering course. It explains not just **what** each line of your code does, but **why** it exists, **how** the underlying protocols, runtimes, and databases execute it, and **how to mentally trace and debug** every request from the browser down to PostgreSQL.

---

# Table of Contents
1. [Architecture & Request Lifecycle](#1-architecture--request-lifecycle)
2. [Core Backend Concepts](#2-core-backend-concepts)
3. [File-by-File Line-by-Line Breakdown](#3-file-by-file-line-by-line-breakdown)
   - [`src/index.ts`](#srcindexts)
   - [`src/env.ts`](#srcenvts)
   - [`src/prisma.ts`](#srcprismats)
   - [`src/utils/jwt.ts`](#srcutilsjwtts)
   - [`src/utils/passkey-display.ts`](#srcutilspasskey-displayts)
   - [`src/middleware/auth.middleware.ts`](#srcmiddlewareauthmiddlewarets)
   - [`src/routes/auth.routes.ts`](#srcroutesauthroutests)
   - [`src/routes/vault.routes.ts`](#srcroutesvaultroutests)
   - [`src/services/email.service.ts`](#srcservicesemailservicets)
   - [`src/services/google-auth.service.ts`](#srcservicesgoogle-authservicets)
   - [`src/controllers/auth.controller.ts`](#srccontrollersauthcontrollerts)
   - [`src/controllers/google-auth.controller.ts`](#srccontrollersgoogle-authcontrollerts)
   - [`src/controllers/vault.controller.ts`](#srccontrollersvaultcontrollerts)
   - [`src/controllers/webauthn.controller.ts`](#srccontrollerswebauthncontrollerts)
4. [Deep Dive: Authentication Systems](#4-deep-dive-authentication-systems)
5. [Deep Dive: JWT & Cookie Mechanics](#5-deep-dive-jwt--cookie-mechanics)
6. [Deep Dive: Prisma ORM & PostgreSQL Internals](#6-deep-dive-prisma-orm--postgresql-internals)
7. [Deep Dive: Google OAuth2 & OpenID Connect](#7-deep-dive-google-oauth2--openid-connect)
8. [Deep Dive: WebAuthn & Hardware Passkeys](#8-deep-dive-webauthn--hardware-passkeys)
9. [Deep Dive: Security Principles & Threat Analysis](#9-deep-dive-security-principles--threat-analysis)
10. [Error Handling & Failure Modes](#10-error-handling--failure-modes)
11. [Environment Variables Reference](#11-environment-variables-reference)
12. [End-to-End Request Traces](#12-end-to-end-request-traces)
13. [Architecture Decisions: Why Not Another Way?](#13-architecture-decisions-why-not-another-way)
14. [How to Debug Gupt Vault Backend](#14-how-to-debug-gupt-vault-backend)
15. [Code Smells, Technical Debt & Refactoring Plan](#15-code-smells-technical-debt--refactoring-plan)
16. [Comprehensive Backend Glossary](#16-comprehensive-backend-glossary)

---

# 1. Architecture & Request Lifecycle

## 1.1 Complete Architecture Diagram

Below is the concrete architecture of your Express backend, showing how data moves across layers:

```mermaid
flowchart TD
    Client["Browser / Next.js Client"] -- "HTTP Request (JSON + Cookies)" --> Express["Express Application (src/index.ts)"]
    
    subgraph Pipeline["Global Middleware Pipeline"]
        Helmet["helmet() (Security Headers)"]
        Cors["cors() (Origin / Credentials Verification)"]
        BodyParser["express.json() (Parse incoming JSON streams)"]
        CookieParser["cookieParser() (Parse Cookie: header into req.cookies)"]
    end
    
    Express --> Helmet
    Helmet --> Cors
    Cors --> BodyParser
    BodyParser --> CookieParser
    
    subgraph Routing["Routing Layer (src/routes/)"]
        AuthRouter["authRoutes (/api/auth)"]
        VaultRouter["vaultRoutes (/api/vault)"]
    end
    
    CookieParser --> AuthRouter
    CookieParser --> VaultRouter
    
    subgraph AuthGuard["Guard Layer (src/middleware/)"]
        AuthMiddleware["authenticate (auth.middleware.ts)"]
    end
    
    AuthRouter -. "Protected routes: /me, /logout, /webauthn/..." .-> AuthMiddleware
    VaultRouter -. "All routes: GET /, PUT /" .-> AuthMiddleware
    
    subgraph Controllers["Controller Layer (src/controllers/)"]
        AuthController["auth.controller.ts"]
        GoogleController["google-auth.controller.ts"]
        WebAuthnController["webauthn.controller.ts"]
        VaultController["vault.controller.ts"]
    end
    
    AuthRouter --> AuthController
    AuthRouter --> GoogleController
    AuthRouter --> WebAuthnController
    AuthMiddleware --> AuthController
    AuthMiddleware --> WebAuthnController
    AuthMiddleware --> VaultController
    
    subgraph ServicesUtils["Services & Utilities (src/services/, src/utils/)"]
        EmailService["email.service.ts (Resend API)"]
        GoogleAuthLib["google-auth-library (Token Verification)"]
        JwtUtil["jwt.ts (Sign / Verify)"]
        PasskeyDisplay["passkey-display.ts (Device Classifier)"]
        CryptoUtil["crypto (Node built-in CSPRNG)"]
    end
    
    AuthController --> EmailService
    AuthController --> JwtUtil
    GoogleController --> GoogleAuthLib
    GoogleController --> JwtUtil
    WebAuthnController --> PasskeyDisplay
    WebAuthnController --> JwtUtil
    AuthMiddleware --> JwtUtil
    
    subgraph DataAccess["Data Access Layer"]
        PrismaSingleton["PrismaClient (src/prisma.ts)"]
        PostgresDB[(PostgreSQL Database)]
    end
    
    AuthController --> PrismaSingleton
    GoogleController --> PrismaSingleton
    WebAuthnController --> PrismaSingleton
    VaultController --> PrismaSingleton
    AuthMiddleware --> PrismaSingleton
    PrismaSingleton -- "SQL over TCP Pool" --> PostgresDB
```

---

## 1.2 The 8-Stage Request Lifecycle

Every single HTTP request sent to Gupt Vault passes through this deterministic sequence:

```
[1. TCP/HTTP Socket]
        ↓
[2. Global Express Middleware Chain]
        ↓
[3. URL Route Matching & Mounting]
        ↓
[4. Route-Level Guard Middleware (authenticate)]
        ↓
[5. Request Controller (Validation & Orchestration)]
        ↓
[6. Service Layer & External Verification]
        ↓
[7. Prisma ORM Query -> PostgreSQL Engine]
        ↓
[8. HTTP Response Serialization & Cookie Deserialization]
```

### Stage 1: TCP Handshake & HTTP Parser
The browser opens a TCP connection to port `3001` and sends raw HTTP text. Node's low-level `http` module parses the request line (e.g. `POST /api/auth/login HTTP/1.1`), the headers, and prepares a readable stream for the request body.

### Stage 2: Global Middleware Chain
Node hands off control to Express (`app`). The request passes sequentially through:
1. `helmet()`: Appends security headers (`X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, etc.) to the pending response.
2. `cors()`: Checks if `req.headers.origin === process.env.APP_URL`. If allowed, attaches `Access-Control-Allow-Origin` and `Access-Control-Allow-Credentials: true`.
3. `express.json()`: Buffers the streaming TCP chunks, parses raw JSON text into a Javascript object, and attaches it to `req.body`.
4. `cookieParser()`: Reads the `Cookie:` HTTP header string, splits key-value pairs separated by semicolons, and attaches parsed cookies to `req.cookies`.

### Stage 3: Routing Match
Express evaluates registered mount points. If the path begins with `/api/auth`, Express forwards execution to `authRoutes`. If the path begins with `/api/vault`, it forwards to `vaultRoutes`.

### Stage 4: Route Guards (`authenticate`)
If a route requires an authenticated user (e.g., `GET /api/vault`), `authenticate` intercepts the request:
- Extracts `req.cookies.token`.
- Validates cryptographic signature using `JWT_SECRET`.
- Extracts `sessionId` and checks PostgreSQL to confirm the session is alive in the database and not expired.
- Attaches `req.user = { id, email }` and `req.sessionId = session.id` to the request object and calls `next()`.

### Stage 5: Controller & Input Validation
The target controller function executes. The first step is synchronous validation using **Zod** (e.g., `loginSchema.parse(req.body)`). If invalid, execution halts and returns HTTP `400 Bad Request`.

### Stage 6: Services & Business Logic
The controller coordinates external services (e.g., checking tokens with Google servers via `google-auth-library`, generating challenges via `@simplewebauthn/server`, or emailing links via `resend`).

### Stage 7: Database Operations via Prisma
The controller calls `prisma.<model>.<operation>()`. The Prisma engine converts TypeScript queries into parameterized SQL, sends them across the database connection pool to PostgreSQL, and converts returned rows back into typed JavaScript objects.

### Stage 8: Response Serialization
The controller sets HTTP status codes (`res.status(200)`), binds response cookies (`res.cookie(...)`), and streams back JSON payloads (`res.json(...)`). Express completes the HTTP response transaction and closes the socket stream.

---

# 2. Core Backend Concepts

---

## 2.1 Express & Middleware Pipeline

### What is it?
Express is a minimalist routing and middleware web framework for Node.js. A **middleware** is a function that receives the incoming request (`req`), the outgoing response (`res`), and a pointer to the next function in line (`next`).

### Why does it exist?
Without middleware, every single endpoint would need to re-implement body parsing, cookie parsing, CORS headers, security headers, and authentication checks. Middleware creates a reusable assembly line.

### How does it work?
Express maintains an internal array of middleware functions (called the "router stack"). When a request arrives, Express invokes function index `0`. When that function calls `next()`, Express invokes index `1`. If a middleware sends a response (`res.send()` or `res.json()`), the chain stops.

### How is it used in Gupt Vault?
- **Global Middleware**: `src/index.ts` lines 14–22 (`helmet`, `cors`, `express.json`, `cookieParser`).
- **Route Guard Middleware**: `src/middleware/auth.middleware.ts` (`authenticate`).

### Example
```ts
function myMiddleware(req: Request, res: Response, next: NextFunction) {
  console.log(`${req.method} ${req.url}`);
  next(); // Pass to next handler
}
```

### Common mistakes
- **Forgetting `next()`**: The request hangs indefinitely until the client times out.
- **Calling `next()` after sending a response**: Throws `Error: Cannot set headers after they are sent to the client`.

---

## 2.2 HTTP Status Codes & Headers

### What is it?
- **Headers**: Metadata key-value pairs sent before the body (e.g., `Content-Type: application/json`, `Set-Cookie: ...`).
- **Status Codes**: 3-digit standardized integers returned by the server indicating the outcome.

### How are they used in Gupt Vault?
- `200 OK`: Request succeeded (vault fetched, logged in).
- `201 Created`: New resource permanently created (`POST /register`, `POST /api/vault` initial).
- `400 Bad Request`: Zod validation failed, missing parameter, or invalid payload.
- `401 Unauthorized`: Missing or invalid JWT, expired session, or bad credentials.
- `403 Forbidden`: User is authenticated, but does not own the requested resource (e.g. attempting to delete another user's passkey).
- `404 Not Found`: User or vault does not exist.
- `409 Conflict`: Optimistic concurrency version mismatch in `vault.controller.ts`.
- `500 Internal Server Error`: Unhandled crash, missing environment variable, or database failure.

---

## 2.3 JWT (JSON Web Tokens) vs. Database Sessions

### What is it?
- **JWT**: A cryptographically signed, stateless string containing encoded claims.
- **Session**: A stateful record saved in the database representing an active login.

### Why does Gupt use BOTH?
Pure JWTs have a critical security flaw: **they cannot be revoked on demand** before their expiration without maintaining a blacklist. Pure sessions have a scalability flaw: every single request must hit the database.

> 💡 **KEY IDEA: Gupt's Hybrid Auth Model**
> Gupt issues a JWT containing `{ userId, sessionId }`. On every request, `authenticate` verifies the JWT signature (ensuring no tampering) **AND** verifies that the `Session` record still exists in PostgreSQL. When a user clicks "Logout" or resets their password, deleting the session record in DB **instantly invalidates the JWT everywhere**.

---

## 2.4 Cookies: HttpOnly, Secure, and SameSite

### What is it?
A cookie is a small key-value pair sent by the server via the `Set-Cookie` response header that the browser automatically stores and attaches to future requests in the `Cookie` header.

### Attributes Used in Gupt Vault (`auth.controller.ts` line 21):
```ts
res.cookie("token", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});
```

1. **`httpOnly: true`**: Completely blocks JavaScript (`document.cookie`) from reading the token. **Mitigates Token Theft via XSS**.
2. **`secure: true`**: Ensures the cookie is only transmitted over encrypted HTTPS connections (enabled in production).
3. **`sameSite: "none"` (prod) / `"lax"` (dev)**: 
   - In production, Gupt's frontend is hosted on a different domain/subdomain than the API. Cross-site cookie transmission requires `SameSite=None` combined with `Secure=true`.
   - In development, `lax` allows cookies to flow between `localhost:3000` and `localhost:3001`.

---

## 2.5 Password Hashing & bcrypt

### What is it?
A one-way mathematical algorithm that converts plaintext into an irreversible digest. You cannot "decrypt" a bcrypt hash.

### How it works:
```
bcrypt.hash(password, saltRounds = 12)
           ↓
Salt Generation: 16 cryptographically random bytes
           ↓
Key Derivation: 2^12 iterations of Blowfish cipher
           ↓
$2b$12$e8nZqP1... (60-character output string containing algorithm, cost, salt, and hash)
```
- **Verification (`bcrypt.compare`)**: Re-hashes the candidate password using the salt extracted from the stored hash and compares the results in constant time.

---

## 2.6 Zero-Knowledge Architecture & Optimistic Concurrency Control

### What is it?
- **Zero-Knowledge**: The server stores only ciphertext. It never receives master passwords, derivation keys, or unencrypted vault items.
- **Optimistic Concurrency Control (OCC)**: A technique to prevent data overwrites when multiple devices sync simultaneously without locking database rows.

### How it works in Gupt Vault:
In [`vault.controller.ts`](server/src/controllers/vault.controller.ts):
1. The client sends `{ version: V, encryptedData: "..." }`.
2. The server compares `version` with the DB row `existingVault.version`.
3. If versions match, the server writes the update and increments version to `V + 1`.
4. If versions do not match, the server returns `409 Conflict`. The client must fetch the server's ciphertext, merge changes locally, and re-attempt.

---

# 3. File-by-File Line-by-Line Breakdown

---

## `src/index.ts`

### 1. Purpose
The bootstrap file of the backend application. Initializes the Express HTTP server, registers top-level global middlewares, mounts API routers, and binds to the listening port.

### 2. Dependencies
- `import "./env"`: Loads `.env` file into `process.env` immediately before any other module reads configuration.
- `express`: Core application framework creating the request pipeline.
- `cors`: Handles Cross-Origin Resource Sharing HTTP headers.
- `helmet`: Automatically configures defensive HTTP response headers.
- `cookieParser`: Middleware that parses raw HTTP `Cookie` header into JavaScript objects.
- `authRoutes`, `vaultRoutes`: Modular Express routers handling sub-paths.

### 3. Line-by-Line Walkthrough

#### Line 1: `import "./env";`
- **What it does**: Executes `src/env.ts` as a side-effect import.
- **Why**: In ES modules, imports are hoisted. If this import were omitted or placed below `authRoutes`, any module reading `process.env.JWT_SECRET` during initialization would receive `undefined`.
- **Runtime**: Node resolves `./env`, which calls `dotenv.config()`, reading `.env` from disk and populating `process.env`.

#### Lines 10–11:
```ts
const app = express();
const port = process.env.PORT || 3001;
```
- **What it does**: Creates an instance of an Express application. Resolves the port from the environment, defaulting to `3001`.
- **Concept**: Application factory pattern. `app` is a callable JavaScript function that accepts `(req, res)` and delegates to the internal middleware stack.

#### Line 14: `app.use(helmet());`
- **What it does**: Attaches Helmet middleware to every incoming request.
- **Why**: Adds 11 security headers, such as `X-Content-Type-Options: nosniff` (prevents MIME sniffing), `X-Frame-Options: SAMEORIGIN` (prevents clickjacking), and `Strict-Transport-Security`.

#### Lines 15–20:
```ts
app.use(
  cors({
    origin: process.env.APP_URL,
    credentials: true,
  }),
);
```
- **What it does**: Intercepts HTTP preflight requests (`OPTIONS`) and standard requests. Validates that `req.headers.origin === process.env.APP_URL`.
- **Why `credentials: true`**: By default, browsers refuse to send or receive cookies across origins. `credentials: true` instructs Express to send `Access-Control-Allow-Credentials: true`.
- **What happens if removed**: The Next.js frontend running on port 3000 will receive browser CORS errors when calling port 3001.

#### Lines 21–22:
```ts
app.use(express.json());
app.use(cookieParser());
```
- **`express.json()`**: Listens to data chunks arriving on the incoming TCP stream when `Content-Type: application/json`. Buffers chunks, calls `JSON.parse()`, and assigns the result to `req.body`.
- **`cookieParser()`**: Reads `req.headers.cookie` string (`token=xyz; other=123`), parses it into `{ token: "xyz", other: "123" }`, and attaches it to `req.cookies`.

#### Lines 25–26:
```ts
app.use("/api/auth", authRoutes);
app.use("/api/vault", vaultRoutes);
```
- **What it does**: Route prefix mounting. Any request starting with `/api/auth` is handed to `authRoutes`. Any starting with `/api/vault` is handed to `vaultRoutes`.

#### Lines 29–35:
```ts
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
```
- **Health check**: Unauthenticated endpoint used by uptime monitors (e.g., Render, Railway, AWS ECS) to verify server responsiveness.
- **`app.listen()`**: Binds a Node `http.Server` to the TCP port and begins accepting incoming network socket connections.

---

## `src/env.ts`

### 1. Purpose
Ensures that environment variables from the root `.env` file are read into memory immediately upon process launch.

### 2. Line-by-Line Walkthrough
```ts
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });
```
- **`path.join(__dirname, "../.env")`**: Resolves an absolute path to the `.env` file located in the parent directory (`server/../.env`). This guarantees that regardless of which working directory you run `npm start` from, the correct `.env` file is loaded.

---

## `src/prisma.ts`

### 1. Purpose
Creates and exports a single, shared instance of `PrismaClient`.

### 2. Line-by-Line Walkthrough
```ts
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
```
- **Concept: Singleton Pattern**.
- **Why this exists**: Instantiating `new PrismaClient()` creates a new connection pool to PostgreSQL. If controllers instantiated `new PrismaClient()` in every file or request, the PostgreSQL server would quickly run out of available socket connections (`max_connections error`). Exporting a single instance shares the database pool across the entire application.

---

## `src/utils/jwt.ts`

### 1. Purpose
Provides type-safe helper functions for cryptographically signing and verifying JSON Web Tokens.

### 2. Line-by-Line Walkthrough
```ts
export interface JwtPayload {
  userId: string;
  sessionId: string;
}
```
- Defines the exact shape of claims packed inside the token payload.

```ts
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return secret;
}
```
- **Fail-fast defense**: If `JWT_SECRET` is missing from the environment, the server immediately throws an error rather than signing tokens with `undefined` (which would allow trivial forgery).

```ts
export const signToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as jwt.SignOptions["expiresIn"],
  });
};
```
- **HMAC-SHA256**: Generates a standard 3-part base64url-encoded JWT signed with the secret key. Default expiration is 7 days.

```ts
export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, getJwtSecret()) as JwtPayload;
  } catch {
    return null;
  }
};
```
- **Safe Verification**: If the token is expired, has an invalid signature, or is malformed, `jwt.verify` throws an exception. This function catches the exception and safely returns `null` instead of crashing.

---

## `src/utils/passkey-display.ts`

### 1. Purpose
Inspects WebAuthn credential metadata returned by authenticators and categorizes the passkey into a user-friendly label and classification (`security_key`, `synced`, or `this_device`).

### 2. Line-by-Line Walkthrough
```ts
export type PasskeyKind = "security_key" | "synced" | "this_device";

export function passkeyDisplay(input: {
  transports: string[] | null;
  credentialBackedUp: boolean;
  credentialDeviceType: string;
}): { kind: PasskeyKind; label: string } {
  const transports = input.transports ?? [];
  if (transports.includes("usb") || transports.includes("nfc")) {
    return { kind: "security_key", label: "Security key" };
  }
  if (
    input.credentialBackedUp ||
    input.credentialDeviceType === "multiDevice"
  ) {
    return { kind: "synced", label: "Synced passkey" };
  }
  return { kind: "this_device", label: "This device" };
}
```
- **Heuristic classification**:
  - If transports include physical buses (`usb`, `nfc`), it is categorized as a hardware **Security key** (e.g., YubiKey).
  - If `credentialBackedUp` is true or `credentialDeviceType === "multiDevice"`, it is a **Synced passkey** (e.g., Apple iCloud Keychain, Google Password Manager).
  - Otherwise, it is local hardware bound to **This device** (e.g., Windows Hello on a desktop).

---

## `src/middleware/auth.middleware.ts`

### 1. Purpose
The primary gatekeeper for protected endpoints. Validates both the stateless cryptographic signature of the cookie token and the stateful liveness of the session in PostgreSQL.

### 2. Line-by-Line Walkthrough

#### Lines 7–13: TypeScript Declaration Merging
```ts
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
  sessionId?: string;
}
```
- **Why**: Express's default `Request` interface does not include `user` or `sessionId`. Extending `Request` allows downstream controllers to access `req.user.id` without TypeScript errors.

#### Lines 15–22: Cookie Extraction
```ts
const token = req.cookies.token;
if (!token) {
  res.status(401).json({ error: 'Unauthorized: No token provided' });
  return;
}
```
- Checks `req.cookies.token`. If the browser did not attach the cookie, execution terminates with `401 Unauthorized`.

#### Lines 24–29: JWT Signature Verification
```ts
const decoded = verifyToken(token);
if (!decoded) {
  res.status(401).json({ error: 'Unauthorized: Invalid token' });
  return;
}
```
- Calls `verifyToken`. If signature verification fails or the token has expired, returns `401`.

#### Lines 31–40: Stateful Session Verification in DB
```ts
const session = await prisma.session.findUnique({
  where: { id: decoded.sessionId },
  include: { user: true },
});

if (!session || session.expiresAt < new Date()) {
  res.status(401).json({ error: 'Unauthorized: Session expired or invalid' });
  return;
}
```
- **Database check**: Verifies that the session ID encoded inside the token has not been revoked in the database.
- Checks `session.expiresAt < new Date()`. If the session has passed its expiration timestamp, rejects the request.

#### Lines 42–48: Context Binding & Delegation
```ts
req.user = {
  id: session.user.id,
  email: session.user.email,
};
req.sessionId = session.id;

next();
```
- Enriches the `req` object with validated user data and passes control to the next handler via `next()`.

---

## `src/routes/auth.routes.ts` & `src/routes/vault.routes.ts`

### 1. Purpose
Declares REST endpoints, associates HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`), and applies route-specific middleware.

### 2. Breakdown
In `auth.routes.ts`:
- **Public Routes**:
  - `POST /register` $\rightarrow$ `register`
  - `POST /login` $\rightarrow$ `login`
  - `POST /google` $\rightarrow$ `googleLogin`
  - `POST /forgot-password` $\rightarrow$ `forgotPassword`
  - `POST /reset-password` $\rightarrow$ `resetPassword`
  - `GET /webauthn/login/generate-options` $\rightarrow$ `generateAuthenticationOptionsHandler`
  - `POST /webauthn/login/verify` $\rightarrow$ `verifyAuthenticationResponseHandler`
- **Protected Routes (Preceded by `authenticate`)**:
  - `POST /logout` $\rightarrow$ `authenticate`, `logout`
  - `GET /me` $\rightarrow$ `authenticate`, `getMe`
  - `GET /webauthn/register/generate-options` $\rightarrow$ `authenticate`, `generateRegistrationOptionsHandler`
  - `POST /webauthn/register/verify` $\rightarrow$ `authenticate`, `verifyRegistrationResponseHandler`
  - `GET /webauthn/passkeys` $\rightarrow$ `authenticate`, `listPasskeysHandler`
  - `DELETE /webauthn/passkeys/:id` $\rightarrow$ `authenticate`, `deletePasskeyHandler`

In `vault.routes.ts`:
- `GET /` $\rightarrow$ `authenticate`, `getVault`
- `PUT /` $\rightarrow$ `authenticate`, `updateVault`

---

## `src/services/email.service.ts`

### 1. Purpose
Handles transactional emails using the **Resend** REST API to deliver password reset links.

### 2. Line-by-Line Walkthrough
```ts
function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY is not configured. Password reset emails are disabled.",
    );
  }
  return new Resend(apiKey);
}
```
- Lazy client initialization: Defers throwing an error until an email is actually sent, allowing the server to boot up even if email sending is unconfigured in development.

```ts
export const sendPasswordResetEmail = async (email: string, resetUrl: string) => {
  const resend = getResendClient();
  const { data, error } = await resend.emails.send({
    from: "Gupt <onboarding@resend.dev>",
    to: [email],
    subject: "Reset your Gupt password",
    html: `...`,
  });
  if (error) throw new Error(error.message);
  return data;
};
```
- Sends an HTML email containing the reset button. The sender `onboarding@resend.dev` is Resend's default sandbox domain for testing.

---

## `src/services/google-auth.service.ts`

### 1. Purpose & Notice
- **Current Status**: Empty file (`0 bytes`).
- **Why**: Google token verification logic was implemented directly inside `src/controllers/google-auth.controller.ts`.
- **Refactoring Recommendation**: Move the Google token verification and user extraction logic into this service file to keep controllers thin.

---

## `src/controllers/auth.controller.ts`

### 1. Purpose
Handles the core credential-based authentication lifecycle: user registration, password verification, cookie issuance, logout, and password recovery.

### 2. Deep Function Breakdown

#### Function: `register(req: Request, res: Response)`
1. **Schema Validation**: Parses `req.body` with `registerSchema` (requires valid email and $\ge$ 8 char password).
2. **Duplicate Check**:
   ```ts
   const existingUser = await prisma.user.findUnique({ where: { email } });
   if (existingUser) {
     res.status(400).json({ error: "User with this email already exists" });
     return;
   }
   ```
3. **Password Hashing**: Computes `await bcrypt.hash(password, 12)`.
4. **User Creation**: Creates the `User` record in PostgreSQL.
5. **Session & Cookie Provisioning**: Creates a `Session` record with a 7-day expiration timestamp, signs a JWT via `signToken({ userId, sessionId })`, and writes the cookie via `setTokenCookie(res, token)`.
6. **Response**: Returns HTTP `201 Created` with `{ user: { id, email } }`.

#### Function: `login(req: Request, res: Response)`
1. **Validation**: Validates email format and password presence.
2. **User Lookup**: Retrieves user by email.
   - If user is not found OR `user.passwordHash === null` (e.g. an account created exclusively via Google OAuth or Passkey), returns `401 Unauthorized: Invalid credentials`.
3. **Password Verification**:
   ```ts
   const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
   ```
   If false, returns `401 Unauthorized`.
4. **Session & Cookie**: Generates a new `Session`, signs a new JWT, binds the cookie, and returns `200 OK`.

#### Function: `logout(req: AuthRequest, res: Response)`
1. Deletes the active session from the database:
   ```ts
   if (req.sessionId) {
     await prisma.session.delete({ where: { id: req.sessionId } });
   }
   ```
2. Tells the browser to discard the cookie:
   ```ts
   res.clearCookie("token");
   ```
3. Returns `200 OK: Logged out successfully`.

#### Function: `forgotPassword(req: Request, res: Response)`
1. **Anti-Enumeration Protection**:
   ```ts
   if (!user) {
     res.status(200).json({
       message: "If an account with that email exists, a password reset link has been generated."
     });
     return;
   }
   ```
   Always returns HTTP `200 OK` regardless of whether the email exists, preventing attackers from probing which emails are registered.
2. **Token Invalidation**: Marks all prior unused reset tokens for this user as `used: true`.
3. **Token Generation**: Generates 32 bytes of cryptographically secure random entropy (`crypto.randomBytes(32).toString("hex")`) with a 1-hour expiration.
4. **Delivery**: In production, emails the link via Resend. In development, logs the link directly to the server terminal.

#### Function: `resetPassword(req: Request, res: Response)`
1. Looks up the reset token in `prisma.passwordReset`. Verifies that `!resetRecord.used` and `expiresAt > new Date()`.
2. Hashes the new password with bcrypt (cost factor 12).
3. **Atomic Transaction (`prisma.$transaction`)**:
   ```ts
   await prisma.$transaction([
     prisma.user.update({ where: { id: resetRecord.userId }, data: { passwordHash } }),
     prisma.passwordReset.update({ where: { id: resetRecord.id }, data: { used: true } }),
     prisma.session.deleteMany({ where: { userId: resetRecord.userId } }),
   ]);
   ```
   - Updates user password.
   - Marks token used.
   - **Invalidates all active sessions**: Forces any attacker or device currently holding old session cookies to be logged out immediately.

---

## `src/controllers/google-auth.controller.ts`

### 1. Purpose
Validates Google OAuth2 ID tokens on the server, provisions accounts, links identities, and creates sessions.

### 2. Deep Function Breakdown: `googleLogin`

```ts
const ticket = await googleClient.verifyIdToken({
  idToken: credential,
  audience: process.env.GOOGLE_CLIENT_ID,
});
```

#### Why the backend MUST verify the token:
The frontend cannot be trusted. Anyone can send a fake POST request with `{ email: "victim@gmail.com" }`. The `google-auth-library` connects to Google's public key infrastructure, verifies the cryptographic signature of the JWT, and verifies that `audience === process.env.GOOGLE_CLIENT_ID` (ensuring the token was generated specifically for your app and not another Google client).

#### Account Resolution Strategy:
1. **Check by `googleId`**: Looks up `prisma.user.findUnique({ where: { googleId } })`. If found, user is authenticated.
2. **Account Linking by Email**: If no account has this `googleId`, searches by `email`. If an email/password account already exists with that email, it updates the record to link `googleId`, merging the identities.
3. **New User Provisioning**: If no user exists, creates a new `User` record with `passwordHash: null`.
4. **Session Creation**: Emits a standard Gupt session and `token` cookie identical to regular password login.

---

## `src/controllers/vault.controller.ts`

### 1. Purpose
Implements zero-knowledge storage and optimistic concurrency synchronization for encrypted vault payloads.

### 2. Deep Function Breakdown

#### Function: `getVault(req: AuthRequest, res: Response)`
- Queries `prisma.vault.findUnique({ where: { userId: req.user.id } })`.
- If missing, returns `404 Vault not found`.
- If found, returns `{ version: vault.version, encryptedData: vault.encryptedData }`.

#### Function: `updateVault(req: AuthRequest, res: Response)`
1. **Input Validation**: Enforces `{ version: positiveInt, encryptedData: string }`.
2. **Conflict Detection (OCC)**:
   ```ts
   if (version !== existingVault.version) {
     res.status(409).json({
       error: 'VAULT_VERSION_CONFLICT',
       serverVersion: existingVault.version,
     });
     return;
   }
   ```
   If the client's base version does not match the database version, someone else updated the vault first. The server rejects the write with `409 Conflict`.
3. **Incremental Versioning**:
   ```ts
   const updatedVault = await prisma.vault.update({
     where: { userId },
     data: {
       encryptedData,
       version: existingVault.version + 1,
     },
   });
   ```
   Increments the version counter atomically on update.
4. **Initial Vault Creation**:
   If no vault exists, enforces `version === 1` and creates the initial record with HTTP `201 Created`.

---

## `src/controllers/webauthn.controller.ts`

### 1. Purpose
Manages hardware authenticator (TouchID, FaceID, YubiKey) registration and passwordless WebAuthn login using `@simplewebauthn/server`.

### 2. Deep Function Breakdown

#### 1. `generateRegistrationOptionsHandler`
- User must be authenticated (`req.user`).
- Fetches all user's existing passkeys to populate `excludeCredentials` (prevents registering the same hardware key twice).
- Generates a random cryptographic challenge string.
- Saves the challenge in `user.currentChallenge` in the database.
- Returns registration options to the browser.

#### 2. `verifyRegistrationResponseHandler`
- Receives the browser's credential creation attestation.
- Verifies that `verification.expectedChallenge === dbUser.currentChallenge` and that `origin` and `rpID` match your domain.
- Extracts:
  - `credentialID` (raw binary buffer)
  - `credentialPublicKey` (raw binary buffer)
  - `counter` (signature counter tracking)
- Persists the new `Passkey` record in PostgreSQL and resets `user.currentChallenge = null`.

#### 3. `generateAuthenticationOptionsHandler`
- Public endpoint taking `?email=...`.
- Retrieves all registered passkeys for that user to build `allowCredentials`.
- Issues a random challenge and saves it in `user.currentChallenge`.

#### 4. `verifyAuthenticationResponseHandler`
- Receives the signed assertion from the hardware authenticator.
- Verifies the signature against the stored `credentialPublicKey`.
- **Clone Detection**: Verifies that the authenticator's new counter is greater than the stored `counter`. If counter decreased or stayed the same, the key may have been cloned!
- Updates the counter in DB, creates a new `Session`, signs a JWT, and sets the auth cookie.

#### 5. `deletePasskeyHandler` (With Lockout Protection)
- Verifies the user owns the passkey (`passkey.userId === user.id`).
- **Account Lockout Guard (lines 390–406)**:
  ```ts
  if (passkeyCount <= 1 && !dbUser?.passwordHash && !dbUser?.googleId) {
    res.status(400).json({
      error: "Add a password or another sign-in method before removing your only passkey."
    });
    return;
  }
  ```
  If a user has no password and no Google account, deleting their only passkey would permanently lock them out of their account. The controller intercepts and rejects this action.

---

# 4. Deep Dive: Authentication Systems

---

## 4.1 Registration Trace

```
Browser: User enters email + password
   │
   ▼
HTTP POST /api/auth/register
Headers: Content-Type: application/json
Body: { "email": "alice@example.com", "password": "supersecretpassword123" }
   │
   ▼
[1] Express App (`src/index.ts`):
    - helmet() adds security headers
    - cors() verifies origin
    - express.json() parses body into `req.body`
   │
   ▼
[2] Router (`src/routes/auth.routes.ts`):
    - Matches path `/register` -> calls `register` controller
   │
   ▼
[3] Controller (`src/controllers/auth.controller.ts`):
    - Zod validates format: `registerSchema.parse(req.body)`
    - Queries DB: `prisma.user.findUnique({ where: { email } })`
    - Computes hash: `bcrypt.hash(password, 12)`
    - Inserts user: `prisma.user.create({ data: { email, passwordHash } })`
    - Inserts session: `prisma.session.create({ data: { userId, token: uuid, expiresAt: now + 7d } })`
    - Signs JWT: `signToken({ userId, sessionId })`
    - Sets cookie: `res.cookie('token', jwt, { httpOnly: true, ... })`
    - Returns HTTP 201 Created: `{ "user": { "id": "...", "email": "..." } }`
   │
   ▼
Browser stores HttpOnly cookie `token` and navigates to `/app/setup`
```

---

## 4.2 Email / Password Login Trace

```
Browser: User submits login form
   │
   ▼
HTTP POST /api/auth/login
   │
   ▼
[1] Router matches `/login` -> calls `login` controller
   │
   ▼
[2] Controller (`auth.controller.ts`):
    - Zod validates inputs
    - Queries DB: `prisma.user.findUnique({ where: { email } })`
    - Checks if user exists and has a `passwordHash`
    - Compares passwords in constant time: `bcrypt.compare(password, user.passwordHash)`
    - Creates new `Session` record in DB (7 days expiry)
    - Signs new JWT with `userId` and `sessionId`
    - Binds `token` to response cookie
    - Sends HTTP 200 OK: `{ "message": "Logged in successfully", "user": ... }`
```

---

## 4.3 Password Reset Trace & Invalidation

```
[Step 1: Request Reset]
User submits email -> POST /api/auth/forgot-password
  ↓
Invalidate old unused reset tokens: `passwordReset.updateMany({ used: true })`
  ↓
Generate 32-byte crypto random token: `crypto.randomBytes(32).toString('hex')`
  ↓
Save to DB with 1-hour expiry
  ↓
Email sent via Resend API (or logged to terminal in dev)

[Step 2: Submit Reset]
User clicks email link -> POST /api/auth/reset-password { token, password }
  ↓
Validate token in DB: must exist, used === false, expiresAt > now
  ↓
Hash new password via bcrypt
  ↓
Execute Atomic Database Transaction:
  1. Update user passwordHash
  2. Mark reset token used = true
  3. DELETE ALL SESSIONS for this user (`prisma.session.deleteMany`)
  ↓
All existing active cookies on any browser are instantly invalidated!
```

---

# 5. Deep Dive: JWT & Cookie Mechanics

---

## 5.1 Anatomy of a JSON Web Token

A JWT is a single string with three parts separated by periods (`.`):

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJzZXNzaW9uSWQiOiI0NTYiLCJpYXQiOjE2...,...
└──────────────┬───────────────────┘ └──────────────────────┬──────────────────────┘ └────────┬────────┘
             Header                                      Payload                           Signature
```

1. **Header**: Base64url-encoded JSON specifying algorithm (`{"alg": "HS256", "typ": "JWT"}`).
2. **Payload**: Base64url-encoded JSON containing the claims (`{"userId": "...", "sessionId": "...", "exp": 1700000000}`).
3. **Signature**: Cryptographic hash calculated as:
   $$\text{HMAC-SHA256}(\text{Header} + "." + \text{Payload},\; \text{JWT\_SECRET})$$

> 🧠 **REMEMBER**: The payload of a JWT is **NOT ENCRYPTED**. Anyone who inspects the token can base64-decode the payload and read the `userId`. Never put passwords, private keys, or secrets inside a JWT payload.

---

## 5.2 Why HttpOnly Cookie vs. LocalStorage?

| Feature | `localStorage` | `HttpOnly` Cookie |
| :--- | :--- | :--- |
| **Accessible by JavaScript?** | **YES** (`localStorage.getItem()`) | **NO** (Blocked by browser engine) |
| **XSS Vulnerability** | **Extremely High**: Any injected script can steal your token immediately. | **Protected**: XSS cannot read the cookie string. |
| **Automatic Transmission** | Must manually attach to `Authorization: Bearer` header on every fetch. | **Automatic**: Browser attaches `Cookie:` header to every API request. |
| **CSRF Consideration** | Immune to traditional CSRF (script must explicitly attach header). | Requires `SameSite` attribute configuration (Gupt uses `SameSite=Lax/None`). |

---

# 6. Deep Dive: Prisma ORM & PostgreSQL Internals

---

## 6.1 Database Schema Diagram & Foreign Keys

```
 User (1) ───────────< (Many) Session       [Cascade Delete]
 User (1) ───────────< (Many) Passkey       [Cascade Delete]
 User (1) ───────────< (Many) PasswordReset [Cascade Delete]
 User (1) ───────────< (1)    Vault         [Cascade Delete]
```

Every relation is defined with `onDelete: Cascade`.
- **What this means**: If an administrator or user triggers `prisma.user.delete({ where: { id } })`, PostgreSQL automatically executes cascading deletes across `Vault`, `Session`, `Passkey`, and `PasswordReset`. No orphan rows can ever remain in the database.

---

## 6.2 Prisma Query to SQL Translation

When you write in TypeScript:
```ts
const session = await prisma.session.findUnique({
  where: { id: decoded.sessionId },
  include: { user: true },
});
```

Prisma's internal Rust query engine compiles that operation into the following parameterized SQL query:

```sql
SELECT 
  "s"."id", "s"."userId", "s"."token", "s"."expiresAt", "s"."createdAt",
  "u"."id" AS "user_id", "u"."email" AS "user_email", "u"."name" AS "user_name"
FROM "public"."Session" AS "s"
LEFT JOIN "public"."User" AS "u" ON ("s"."userId" = "u"."id")
WHERE "s"."id" = $1
LIMIT 1;
```

Parameter `$1` is bound directly by PostgreSQL's query planner. This completely prevents **SQL Injection** because user input is never concatenated directly into the SQL string.

---

# 7. Deep Dive: Google OAuth2 & OpenID Connect

```
Browser (User clicks Google button)
   │
   ▼
Google Identity Services (GSI) Popup
User logs into accounts.google.com
   │
   ▼
Google returns signed ID Token (JWT) to browser
   │
   ▼
Browser sends ID Token: POST /api/auth/google { credential: "..." }
   │
   ▼
Gupt Backend (`google-auth.controller.ts`):
   │
   ├─► Calls `googleClient.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID })`
   │   - Fetches Google's public JSON Web Key Set (JWKS)
   │   - Verifies RSA-256 signature
   │   - Asserts `token.aud === process.env.GOOGLE_CLIENT_ID`
   │   - Asserts `token.iss` matches Google's issuer domains
   │   - Asserts `token.exp` is in the future
   │
   ├─► Extracts verified claims: { sub (googleId), email, email_verified, name, picture }
   │
   ├─► Matches or creates user in PostgreSQL
   │
   └─► Creates Gupt Session, sets HttpOnly cookie, and returns user profile
```

---

# 8. Deep Dive: WebAuthn & Hardware Passkeys

WebAuthn replaces passwords with **asymmetric public-key cryptography**:

```
[Registration Phase]
1. Server generates random cryptographic challenge string (e.g. "a8f3b9...")
2. Server saves challenge to DB: `user.currentChallenge = challenge`
3. Browser invokes authenticator (FaceID / TouchID / YubiKey)
4. Authenticator hardware generates a unique private/public keypair on chip
5. Authenticator signs the challenge with the PRIVATE key
6. Browser sends public key + signature to backend
7. Backend verifies signature with public key
8. Backend stores Public Key in database. Private key NEVER leaves the hardware chip!

[Login Phase]
1. Server sends new random challenge
2. Authenticator signs challenge using its hardware PRIVATE key
3. Server looks up stored PUBLIC key in DB and verifies the signature
4. Verified! User is authenticated without any password ever traveling over the network.
```

---

# 9. Deep Dive: Security Principles & Threat Analysis

| Threat / Attack Vector | Real-World Risk | Gupt Vault Protection Mechanism | Status |
| :--- | :--- | :--- | :--- |
| **SQL Injection** | Attacker executes unauthorized SQL commands | All queries use Prisma ORM with parameterized inputs |  **PROTECTED** |
| **XSS Token Theft** | Malicious script steals auth token from `localStorage` | JWT is stored in an `HttpOnly` cookie inaccessible to JavaScript |  **PROTECTED** |
| **Password Hash Cracking** | Leaked DB reveals user passwords | Salted bcrypt with high cost factor (12 rounds) |  **PROTECTED** |
| **Replay Attacks (Passkeys)**| Attacker intercepts and replays signed passkey payload | WebAuthn `counter` increment check + single-use `challenge` in DB |  **PROTECTED** |
| **Sync Data Overwrites** | Device B overwrites Device A's newer vault items | Optimistic Concurrency Control (`409 VAULT_VERSION_CONFLICT`) |  **PROTECTED** |
| **Account Lockout on Passkey Removal** | User deletes only sign-in method and is locked out | Guard in `deletePasskeyHandler` blocks deletion if 0 other credentials exist |  **PROTECTED** |
| **Account Enumeration** | Attacker tests if an email is registered | `forgotPassword` returns identical success message even if email is missing |  **PROTECTED** |
| **Brute Force Login** | Attacker tries 10,000 password guesses | Rate limiting / IP throttling middleware | ⚠️ **NOT IMPLEMENTED** |
| **CSRF in Cross-Domain Prod** | Malicious site tricks browser into sending cookies | `SameSite=None` without explicit Anti-CSRF token verification | ⚠️ **POTENTIAL CONCERN** |

---

# 10. Error Handling & Failure Modes

Gupt Vault handles errors using structured `try / catch` blocks at the controller boundary:

```ts
try {
  const { email, password } = loginSchema.parse(req.body); // 1. Can throw ZodError
  const user = await prisma.user.findUnique(...);          // 2. Can throw PrismaClientKnownRequestError
  ...
} catch (error) {
  if (error instanceof z.ZodError) {
    res.status(400).json({ error: error.issues[0].message });
    return;
  }
  console.error("Login error:", error);
  res.status(500).json({ error: "Internal server error" });
}
```

### Trace: Successful vs. Failed Request

```text
[SCENARIO 1: Failed Request - Invalid Email]
Client: POST /api/auth/login { "email": "notanemail", "password": "123" }
   ↓
loginSchema.parse(req.body) throws z.ZodError
   ↓
catch block catches error
   ↓
Evaluates: error instanceof z.ZodError === true
   ↓
Returns: HTTP 400 Bad Request { "error": "Invalid email" }
   ↓
Client receives 400 and displays error message in form toast

[SCENARIO 2: Failed Request - Database Down]
Client: POST /api/auth/login { "email": "alice@example.com", "password": "password123" }
   ↓
prisma.user.findUnique throws ConnectionRefusedError
   ↓
catch block catches error
   ↓
Logs details to server terminal: console.error("Login error:", error)
   ↓
Returns sanitized response: HTTP 500 { "error": "Internal server error" }
   ↓
Client receives generic 500 without leaking database credentials or query syntax
```

---

# 11. Environment Variables Reference

| Variable | Purpose | Used By | Required? | Example Value |
| :--- | :--- | :--- | :---: | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `prisma/schema.prisma` | **YES** | `postgresql://user:pass@localhost:5432/gupt` |
| `PORT` | TCP port Express listens on | `src/index.ts` | NO (default: 3001) | `3001` |
| `APP_URL` | Frontend origin for CORS and cookies | `src/index.ts`, `auth.controller.ts` | **YES** | `http://localhost:3000` |
| `JWT_SECRET` | Secret key used to sign session JWTs | `src/utils/jwt.ts` | **YES** | `c83f9...64-char-random-hex` |
| `JWT_EXPIRES_IN`| Lifespan of JWT | `src/utils/jwt.ts` | NO (default: 7d) | `7d` |
| `GOOGLE_CLIENT_ID`| Client ID for Google OAuth verification | `google-auth.controller.ts` | NO (if Google off)| `12345...apps.googleusercontent.com` |
| `RESEND_API_KEY`| API key to deliver transactional emails | `services/email.service.ts` | NO (dev logs) | `re_abc123...` |

---

# 12. End-to-End Request Traces

### Example: Passkey Passwordless Login
1. **User clicks "Sign in with Passkey"**:
   - Client sends: `GET /api/auth/webauthn/login/generate-options?email=alice@example.com`.
   - `webauthn.controller.ts` fetches Alice's credentials from DB, generates a challenge, stores it in `user.currentChallenge`, and returns options.
2. **Browser prompts user for TouchID/FaceID**:
   - Authenticator signs challenge using Alice's private key.
3. **Client submits assertion**:
   - Client sends: `POST /api/auth/webauthn/login/verify` `{ email, response }`.
   - Server checks signature against stored `credentialPublicKey`.
   - Verifies `counter > passkey.counter` (anti-clone check).
   - Updates `passkey.counter = newCounter` and `user.currentChallenge = null`.
   - Creates a database `Session` and issues the `token` cookie.
   - Client is logged in!

---

# 13. Architecture Decisions: Why Not Another Way?

### 1. Why bcrypt instead of plain passwords?
- **Plaintext**: If the database is dumped or leaked, every user's master credentials are immediately compromised across all services.
- **bcrypt**: Computationally expensive hashing algorithm with adaptive work factor (salt rounds). A database dump requires billions of years of GPU compute to crack strong passwords.

### 2. Why Prisma instead of raw SQL queries?
- **Raw SQL**: Prone to syntax mistakes, manual mapping of rows to objects, and potential SQL injection if queries are formatted manually.
- **Prisma**: Generates 100% type-safe database queries synchronized with your schema, automates database migrations, and handles connection pooling.

### 3. Why optimistic concurrency control instead of database row locks?
- **Pessimistic Locking (`SELECT ... FOR UPDATE`)**: Holding row locks open while waiting for client encryption or network rounds degrades database throughput and leads to deadlocks.
- **Optimistic Concurrency**: Fast, lock-free writes. In the 99% case where only one device writes at a time, zero lock overhead is incurred. If a conflict occurs, the client simply merges and retries.

---

# 14. How to Debug Gupt Vault Backend

When an API call fails, follow this deterministic mental debugging ladder:

```
Step 1: Check HTTP Status Code in Browser DevTools Network Tab
   ├─► 401 Unauthorized?
   │     ├─ Did the browser send the `Cookie: token=...` header?
   │     ├─ Is `JWT_SECRET` set in `.env`?
   │     └─ Check DB: Did the session record expire or get deleted?
   │
   ├─► 400 Bad Request?
   │     ├─ Look at response JSON: `{ "error": "..." }`
   │     └─ Check Zod schema in controller. Did the client omit a required field?
   │
   ├─► 409 Conflict?
   │     └─ Vault version mismatch. Inspect `serverVersion` in database vs client request.
   │
   ├─► 500 Internal Server Error?
   │     └─ Open the server terminal! Look for unhandled stack traces or missing env vars.
   │
   └─► CORS Error? (Browser blocks response)
         ├─ Does `APP_URL` in `server/.env` exactly match your frontend port (e.g. `http://localhost:3000`)?
         └─ Check `credentials: true` in both client `fetch/axios` and server `cors()`.
```

---

# 15. Code Smells, Technical Debt & Refactoring Plan

During this deep dive analysis, the following technical debt and improvements were identified:

### 1. Duplicate PrismaClient Instances
- **Location**: `webauthn.controller.ts`, `vault.controller.ts`, and `auth.middleware.ts` each execute `const prisma = new PrismaClient();` individually instead of importing the singleton from `../prisma`.
- **Impact**: Spawns multiple connection pools, risking connection exhaustion under high load.
- **Fix**: Replace with `import { prisma } from "../prisma";`.

### 2. Missing Centralized Global Error Middleware
- **Location**: Every controller manually implements its own `try/catch` and `res.status(500).json(...)`.
- **Impact**: Code duplication. If an asynchronous error escapes without a catch block, Express 5 handles it, but unhandled rejections can leak implementation details.
- **Fix**: Implement a standard Express error middleware `(err, req, res, next)` at the bottom of `src/index.ts`.

### 3. Empty `google-auth.service.ts`
- **Location**: `src/services/google-auth.service.ts` is 0 bytes, while `google-auth.controller.ts` is 146 lines.
- **Fix**: Move the token verification logic into `google-auth.service.ts` following separation of concerns.

### 4. Missing Rate Limiting
- **Location**: `/api/auth/login` and `/api/auth/register` have no rate limiting.
- **Impact**: Vulnerable to brute-force credential stuffing.
- **Fix**: Add `express-rate-limit` middleware (e.g. max 5 login attempts per minute per IP).

---

# 16. Comprehensive Backend Glossary

- **API (Application Programming Interface)**: A formal contract and protocol allowing software systems to communicate over HTTP using structured requests and responses.
- **Asymmetric Cryptography**: A mathematical cryptographic system using keypairs: a public key (shareable) and a private key (secret, hardware-bound).
- **Authentication (AuthN)**: Verifying **who** a user is (e.g., matching a password, verifying a passkey, or checking an OAuth token).
- **Authorization (AuthZ)**: Verifying **what** an authenticated user is permitted to do (e.g., verifying user A owns vault A before returning it).
- **bcrypt**: A password-hashing function designed with a configurable cost factor to resist brute-force hardware cracking attacks.
- **CORS (Cross-Origin Resource Sharing)**: A browser security mechanism that restricts web applications from making HTTP requests to a domain different from the one that served the web page unless the server explicitly grants permission via headers.
- **CSRF (Cross-Site Request Forgery)**: An exploit where an unauthorized site tricks a victim's browser into executing an unwanted action on a trusted site where the user is authenticated.
- **Express Middleware**: A function in the Express request-response cycle that has access to `req`, `res`, and `next`, used to perform operations or validation before passing control forward.
- **HttpOnly**: A flag for the `Set-Cookie` header that blocks client-side scripts from reading the cookie value, neutralizing token theft via XSS.
- **JWT (JSON Web Token)**: An open standard (RFC 7519) defining a compact, URL-safe means of securely transmitting claims between parties as a cryptographically signed JSON object.
- **Optimistic Concurrency Control (OCC)**: A database management strategy where transactions proceed without row locks; before writing, the transaction checks if another update has incremented the record version.
- **ORM (Object-Relational Mapping)**: A software layer that translates database tables and relational records into typed JavaScript objects and methods.
- **Prisma**: A modern Next-generation TypeScript ORM that uses a schema file to generate migrations and a fully type-safe database client.
- **WebAuthn**: A web standard published by the W3C and FIDO Alliance providing passwordless, phishing-resistant hardware credential authentication.
- **XSS (Cross-Site Scripting)**: A security vulnerability enabling attackers to inject malicious client-side scripts into web pages viewed by other users.
- **Zod**: A TypeScript-first schema declaration and validation library used to validate runtime input data at application boundaries.
