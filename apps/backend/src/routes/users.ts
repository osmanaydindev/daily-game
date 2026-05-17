import { Router } from 'express';
import { getMe, updateMe } from '../controllers/users.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updateSelfSchema } from '../validation/user.schemas';

const router = Router();

router.use(requireAuth);
router.get('/me', getMe);
router.patch('/me', validate(updateSelfSchema), updateMe);

export default router;
