import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

import { prisma } from "../prisma";
import { signToken } from "../utils/jwt";
import { setTokenCookie } from "./auth.controller";
import {
  verifyGoogleToken,
  findOrCreateGoogleUser,
} from "../services/google-auth.service";

export const googleLogin = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { credential } = req.body;

    if (!credential) {
      res.status(400).json({
        error: "Google credential is required",
      });
      return;
    }

    // 1. Verify the Google ID token and extract user profile claims
    const profile = await verifyGoogleToken(credential);

    // 2. Find, link, or provision user in DB
    const user = await findOrCreateGoogleUser(profile);

    // 3. Create session (7 days validity)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token: crypto.randomUUID(),
        expiresAt,
      },
    });

    // 4. Create and set auth token cookie
    const token = signToken({
      userId: user.id,
      sessionId: session.id,
    });

    setTokenCookie(res, token);

    res.status(200).json({
      message: "Logged in with Google successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};
