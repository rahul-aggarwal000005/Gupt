import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

/**
 * Custom application error class allowing controllers and services
 * to throw strongly-typed errors with custom HTTP status codes.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 404 Not Found handler for unmatched routes.
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.path}` });
};

/**
 * Centralized Type-Safe Error Handler Middleware.
 * Typed with ErrorRequestHandler to guarantee the (err, req, res, next) signature.
 */
export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // If response stream has already begun, delegate to Express default handler
  if (res.headersSent) {
    return next(err);
  }

  // 1. Handle Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      error: err.issues[0]?.message || "Validation error",
      details: err.issues,
    });
    return;
  }

  // 2. Handle Custom AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
    });
    return;
  }

  // 3. Handle Prisma unique constraint violations (P2002)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const target = Array.isArray(err.meta?.target)
        ? err.meta.target.join(", ")
        : "Field";
      res.status(409).json({
        error: `A record with this ${target} already exists.`,
      });
      return;
    }
  }

  // 4. Fallback for unhandled/internal server errors
  console.error("Unhandled Application Error:", err);

  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err instanceof Error
        ? err.message
        : "Internal server error";

  res.status(500).json({ error: message });
};
