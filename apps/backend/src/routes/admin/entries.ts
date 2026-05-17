import { Router } from 'express';
import { listAllEntries, updateEntry, getDashboardStats } from '../../controllers/admin/entries.controller';
import { validate } from '../../middleware/validate';
import { adminUpdateEntrySchema } from '../../validation/entry.schemas';

const router = Router();

router.get('/stats', getDashboardStats);
router.get('/', listAllEntries);
router.patch('/:id', validate(adminUpdateEntrySchema), updateEntry);

export default router;
