import { Router } from 'express';
import { getMe, updateMe, changePassword } from '../controllers/users.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updateSelfSchema, changePasswordSchema } from '../validation/user.schemas';

const router = Router();

router.use(requireAuth);
router.get('/me', getMe);
router.patch('/me', validate(updateSelfSchema), updateMe);
router.patch('/me/password', validate(changePasswordSchema), changePassword);

export default router;
