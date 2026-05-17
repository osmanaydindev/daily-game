import { Router } from 'express';
import { daily, weekly, monthly } from '../controllers/leaderboard.controller';

const router = Router();

router.get('/daily', daily);
router.get('/weekly', weekly);
router.get('/monthly', monthly);

export default router;
