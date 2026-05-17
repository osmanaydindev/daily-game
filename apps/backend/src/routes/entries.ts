import { Router } from 'express';
import { submitEntry, listMyEntries } from '../controllers/entries.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { submitEntrySchema } from '../validation/entry.schemas';

const router = Router();

router.use(requireAuth);
router.get('/', listMyEntries);
router.post('/', validate(submitEntrySchema), submitEntry);

export default router;
