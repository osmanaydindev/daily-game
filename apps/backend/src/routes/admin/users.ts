import { Router } from 'express';
import { listUsers, createUser, updateUser, deactivateUser } from '../../controllers/admin/users.controller';
import { validate } from '../../middleware/validate';
import { createUserSchema, adminUpdateUserSchema } from '../../validation/user.schemas';

const router = Router();

router.get('/', listUsers);
router.post('/', validate(createUserSchema), createUser);
router.patch('/:id', validate(adminUpdateUserSchema), updateUser);
router.delete('/:id', deactivateUser);

export default router;
