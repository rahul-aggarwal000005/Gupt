import { OAuth2Client } from "google-auth-library";
import { prisma } from "../prisma";
import { User } from "@prisma/client";
import { AppError } from "../middleware/error.middleware";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export interface GoogleUserProfile {
  googleId: string;
  email: string;
  name?: string;
  picture?: string;
}

/**
 * Verifies a Google ID token with Google's servers and extracts verified profile claims.
 */
export async function verifyGoogleToken(
  idToken: string,
): Promise<GoogleUserProfile> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new AppError("Google authentication is not configured", 500);
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: clientId,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.sub || !payload.email || !payload.email_verified) {
    throw new AppError("Invalid or unverified Google account credential", 401);
  }

  return {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
  };
}

/**
 * Finds, links, or creates a Gupt user from verified Google profile data.
 */
export async function findOrCreateGoogleUser(
  profile: GoogleUserProfile,
): Promise<User> {
  const { googleId, email, name, picture } = profile;

  // 1. Find existing account by googleId
  let user = await prisma.user.findUnique({
    where: { googleId },
  });

  if (user) {
    return user;
  }

  // 2. If not found by googleId, check by email to link existing account
  user = await prisma.user.findUnique({
    where: { email },
  });

  if (user) {
    return await prisma.user.update({
      where: { id: user.id },
      data: {
        googleId,
        name: user.name ?? name,
        avatarUrl: user.avatarUrl ?? picture,
      },
    });
  }

  // 3. If no account exists at all, create a new one
  return await prisma.user.create({
    data: {
      email,
      googleId,
      passwordHash: null,
      name,
      avatarUrl: picture,
    },
  });
}
