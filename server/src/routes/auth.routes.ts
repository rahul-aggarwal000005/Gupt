import { Router } from 'express';
import { register, login, logout, getMe, forgotPassword, resetPassword } from '../controllers/auth.controller';
import { googleLogin } from '../controllers/google-auth.controller';
import { 
  generateRegistrationOptionsHandler, 
  verifyRegistrationResponseHandler,
  generateAuthenticationOptionsHandler,
  verifyAuthenticationResponseHandler
} from '../controllers/webauthn.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// WebAuthn routes
router.get('/webauthn/register/generate-options', authenticate, generateRegistrationOptionsHandler);
router.post('/webauthn/register/verify', authenticate, verifyRegistrationResponseHandler);
router.get('/webauthn/login/generate-options', generateAuthenticationOptionsHandler);
router.post('/webauthn/login/verify', verifyAuthenticationResponseHandler);

export default router;