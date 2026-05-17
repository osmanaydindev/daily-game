import { Router } from 'express';
import { listGames, getGame } from '../controllers/games.controller';

const router = Router();

router.get('/', listGames);
router.get('/:slug', getGame);

export default router;
