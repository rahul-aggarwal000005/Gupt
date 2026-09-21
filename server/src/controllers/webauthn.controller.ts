import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { AuthRequest } from '../middleware/auth.middleware';
import { signToken } from '../utils/jwt';
import { z } from 'zod';

const prisma = new PrismaClient();

// In production, this should be the actual domain (e.g., 'gupt.app')
const rpID = process.env.NODE_ENV === 'production' ? 'localhost' : 'localhost';
const expectedOrigin = process.env.APP_URL || 'http://localhost:3000';

const setTokenCookie = (res: Response, token: string) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// --- REGISTRATION ---

export const generateRegistrationOptionsHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userPasskeys = await prisma.passkey.findMany({ where: { userId: user.id } });

    const options = await generateRegistrationOptions({
      rpName: 'Gupt Vault',
      rpID,
      userID: new Uint8Array(Buffer.from(user.id)),
      userName: user.email,
      attestationType: 'none',
      excludeCredentials: userPasskeys.map(passkey => ({
        id: Buffer.from(passkey.credentialID).toString('base64url'),
        type: 'public-key',
      })),
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'preferred',
      },
    });

    // Save challenge to user
    await prisma.user.update({
      where: { id: user.id },
      data: { currentChallenge: options.challenge },
    });

    res.status(200).json(options);
  } catch (error) {
    console.error('generateRegistrationOptions error:', error);
    res.status(500).json({ error: 'Failed to generate registration options' });
  }
};

export const verifyRegistrationResponseHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser || !dbUser.currentChallenge) {
      res.status(400).json({ error: 'No active registration challenge found' });
      return;
    }

    const verification = await verifyRegistrationResponse({
      response: req.body,
      expectedChallenge: dbUser.currentChallenge,
      expectedOrigin,
      expectedRPID: rpID,
    });

    const { verified, registrationInfo } = verification;

    if (verified && registrationInfo) {
      const { credential, credentialDeviceType, credentialBackedUp } = registrationInfo;

      await prisma.passkey.create({
        data: {
          userId: user.id,
          credentialID: Buffer.from(credential.id, 'base64url'),
          credentialPublicKey: Buffer.from(credential.publicKey),
          counter: BigInt(credential.counter),
          credentialDeviceType,
          credentialBackedUp,
          transports: credential.transports ? JSON.stringify(credential.transports) : null,
        },
      });

      // Clear challenge
      await prisma.user.update({
        where: { id: user.id },
        data: { currentChallenge: null },
      });

      res.status(200).json({ verified: true });
    } else {
      res.status(400).json({ error: 'Registration verification failed' });
    }
  } catch (error: any) {
    console.error('verifyRegistrationResponse error:', error);
    res.status(400).json({ error: error.message || 'Failed to verify registration' });
  }
};

// --- AUTHENTICATION (LOGIN) ---

const loginOptionsSchema = z.object({
  email: z.string().email(),
});

export const generateAuthenticationOptionsHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = loginOptionsSchema.parse(req.query);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const userPasskeys = await prisma.passkey.findMany({ where: { userId: user.id } });
    if (userPasskeys.length === 0) {
      res.status(400).json({ error: 'No passkeys registered for this user' });
      return;
    }

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: userPasskeys.map(passkey => ({
        id: Buffer.from(passkey.credentialID).toString('base64url'),
        type: 'public-key',
      })),
      userVerification: 'preferred',
    });

    // Save challenge to user
    await prisma.user.update({
      where: { id: user.id },
      data: { currentChallenge: options.challenge },
    });

    res.status(200).json(options);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0].message });
      return;
    }
    console.error('generateAuthenticationOptions error:', error);
    res.status(500).json({ error: 'Failed to generate authentication options' });
  }
};

export const verifyAuthenticationResponseHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, response } = req.body;
    if (!email || !response) {
      res.status(400).json({ error: 'Email and response are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.currentChallenge) {
      res.status(400).json({ error: 'No active authentication challenge found' });
      return;
    }

    // response.id is base64url encoded. We need to find the passkey by credentialID.
    // The easiest way is to fetch all passkeys for the user and match.
    const userPasskeys = await prisma.passkey.findMany({ where: { userId: user.id } });
    
    // Convert base64url id from response back to Buffer to compare, or just compare base64url strings.
    // Actually, simplewebauthn handles finding the right credential if we pass it the authenticator object.
    
    // We need to find the specific passkey used
    const passkey = userPasskeys.find(pk => {
       return Buffer.from(pk.credentialID).toString('base64url') === response.id || 
              Buffer.from(pk.credentialID).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '') === response.id;
    });

    if (!passkey) {
       res.status(400).json({ error: 'Passkey not found' });
       return;
    }

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: user.currentChallenge,
      expectedOrigin,
      expectedRPID: rpID,
      credential: {
        id: Buffer.from(passkey.credentialID).toString('base64url'),
        publicKey: new Uint8Array(passkey.credentialPublicKey),
        counter: Number(passkey.counter),
        transports: passkey.transports ? JSON.parse(passkey.transports) : undefined,
      },
    });

    const { verified, authenticationInfo } = verification;

    if (verified && authenticationInfo) {
      // Update counter
      await prisma.passkey.update({
        where: { id: passkey.id },
        data: { counter: BigInt(authenticationInfo.newCounter) },
      });

      // Clear challenge
      await prisma.user.update({
        where: { id: user.id },
        data: { currentChallenge: null },
      });

      // Create session and log in
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const session = await prisma.session.create({
        data: {
          userId: user.id,
          token: 'legacy_token_field_not_used_directly',
          expiresAt,
        },
      });

      const token = signToken({ userId: user.id, sessionId: session.id });
      setTokenCookie(res, token);

      res.status(200).json({
        verified: true,
        user: { id: user.id, email: user.email },
      });
    } else {
      res.status(400).json({ error: 'Authentication verification failed' });
    }
  } catch (error: any) {
    console.error('verifyAuthenticationResponse error:', error);
    res.status(400).json({ error: error.message || 'Failed to verify authentication' });
  }
};