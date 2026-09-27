import { Router } from "express";
import {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller";
import { googleLogin } from "../controllers/google-auth.controller";
import {
  generateRegistrationOptionsHandler,
  verifyRegistrationResponseHandler,
  generateAuthenticationOptionsHandler,
  verifyAuthenticationResponseHandler,
  listPasskeysHandler,
  deletePasskeyHandler,
} from "../controllers/webauthn.controller";
import { authenticate } from "../middleware/auth.middleware";
import {
  authRateLimiter,
  passwordResetRateLimiter,
} from "../middleware/rate-limiter.middleware";

const router = Router();

// Public Credential & OAuth Routes (Protected by Auth Rate Limiter)
router.post("/register", authRateLimiter, register);
router.post("/login", authRateLimiter, login);
router.post("/google", authRateLimiter, googleLogin);

// Protected Session Routes
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, getMe);

// Password Reset Routes (Strictly Rate-Limited)
router.post("/forgot-password", passwordResetRateLimiter, forgotPassword);
router.post("/reset-password", authRateLimiter, resetPassword);

// WebAuthn routes
router.get(
  "/webauthn/register/generate-options",
  authenticate,
  generateRegistrationOptionsHandler,
);
router.post(
  "/webauthn/register/verify",
  authenticate,
  verifyRegistrationResponseHandler,
);
router.get(
  "/webauthn/login/generate-options",
  authRateLimiter,
  generateAuthenticationOptionsHandler,
);
router.post(
  "/webauthn/login/verify",
  authRateLimiter,
  verifyAuthenticationResponseHandler,
);
router.get("/webauthn/passkeys", authenticate, listPasskeysHandler);
router.delete("/webauthn/passkeys/:id", authenticate, deletePasskeyHandler);

export default router;
