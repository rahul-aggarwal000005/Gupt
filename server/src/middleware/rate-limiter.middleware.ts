import rateLimit from "express-rate-limit";

/**
 * Strict limiter for sensitive authentication endpoints (Login, Register, Google).
 * Max 10 requests per 15 minutes per IP.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  standardHeaders: "draft-7", // Return standard RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  message: {
    error: "Too many login/registration attempts. Please try again after 15 minutes.",
  },
});

/**
 * Very strict limiter for password reset requests to protect email quotas.
 * Max 3 requests per 1 hour per IP.
 */
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 3,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: "Too many password reset requests. Please try again in an hour.",
  },
});

/**
 * General limiter for public API endpoints to prevent request flooding.
 * Max 300 requests per 15 minutes per IP.
 */
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please slow down.",
  },
});
