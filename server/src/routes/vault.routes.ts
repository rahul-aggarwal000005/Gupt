import { Router } from 'express';
import { getVault, updateVault } from '../controllers/vault.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getVault);
router.put('/', authenticate, updateVault);

export default router;