import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

const updateVaultSchema = z.object({
  version: z.number().int().positive(),
  encryptedData: z.string(),
});

export const getVault = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const vault = await prisma.vault.findUnique({
      where: { userId },
    });

    if (!vault) {
      res.status(404).json({ error: 'Vault not found' });
      return;
    }

    res.status(200).json({
      version: vault.version,
      encryptedData: vault.encryptedData,
    });
  } catch (error) {
    console.error('Get vault error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateVault = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { version, encryptedData } = updateVaultSchema.parse(req.body);

    const existingVault = await prisma.vault.findUnique({
      where: { userId },
    });

    if (existingVault) {
      // Optimistic concurrency control
      if (version !== existingVault.version) {
        res.status(409).json({
          error: 'VAULT_VERSION_CONFLICT',
          serverVersion: existingVault.version,
        });
        return;
      }

      // Update existing vault
      const updatedVault = await prisma.vault.update({
        where: { userId },
        data: {
          encryptedData,
          version: existingVault.version + 1,
        },
      });

      res.status(200).json({
        version: updatedVault.version,
        message: 'Vault updated successfully',
      });
    } else {
      // Create new vault (version 1)
      if (version !== 1) {
        res.status(400).json({ error: 'Initial vault version must be 1' });
        return;
      }

      const newVault = await prisma.vault.create({
        data: {
          userId,
          encryptedData,
          version: 1,
        },
      });

      res.status(201).json({
        version: newVault.version,
        message: 'Vault created successfully',
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.issues[0].message });
      return;
    }
    console.error('Update vault error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};