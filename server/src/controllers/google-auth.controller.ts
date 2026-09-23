import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import crypto from "crypto";

import { prisma } from "../prisma";
import { signToken } from "../utils/jwt";
import { setTokenCookie } from "./auth.controller";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { credential } = req.body;

    if (!credential) {
      res.status(400).json({
        error: "Google credential is required",
      });

      return;
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      console.error("GOOGLE_CLIENT_ID is not configured");

      res.status(500).json({
        error: "Google authentication is not configured",
      });

      return;
    }

    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      res.status(401).json({
        error: "Invalid Google credential",
      });

      return;
    }

    const { sub: googleId, email, email_verified, name, picture } = payload;

    if (!googleId || !email || !email_verified) {
      res.status(401).json({
        error: "Google account email is not verified",
      });

      return;
    }

    // 1. Find existing Google account
    let user = await prisma.user.findUnique({
      where: {
        googleId,
      },
    });

    // 2. If Google account doesn't exist,
    // check whether this email already belongs
    // to an existing Gupt account.
    if (!user) {
      user = await prisma.user.findUnique({
        where: {
          email,
        },
      });

      // Link Google to existing account
      if (user) {
        user = await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            googleId,
            name: user.name ?? name,
            avatarUrl: user.avatarUrl ?? picture,
          },
        });
      }
    }

    // 3. Create a new Gupt account
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          googleId,
          passwordHash: null,
          name,
          avatarUrl: picture,
        },
      });
    }

    // 4. Create Gupt session
    const expiresAt = new Date();

    expiresAt.setDate(expiresAt.getDate() + 7);

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token: crypto.randomUUID(),
        expiresAt,
      },
    });

    // 5. Create Gupt JWT
    const token = signToken({
      userId: user.id,
      sessionId: session.id,
    });

    // 6. Use the same authentication cookie
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
    console.error("Google login error:", error);

    res.status(401).json({
      error: "Google authentication failed",
    });
  }
};
