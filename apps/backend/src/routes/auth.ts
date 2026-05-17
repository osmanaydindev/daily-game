import { Router } from 'express';
import { login, refresh, logout } from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { authLimiter } from '../middleware/rateLimiter';
import { loginSchema } from '../validation/auth.schemas';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/refresh', authLimiter, refresh);
router.post('/logout', requireAuth, logout);

export default router;
