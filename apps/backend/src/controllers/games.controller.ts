import type { Request, Response } from 'express';
import { Game } from '../models/Game';
import { ok, notFound, serverError } from '../utils/response';

export async function listGames(req: Request, res: Response): Promise<void> {
  try {
    const games = await Game.find({ isActive: true });
    ok(res, games);
  } catch (err) {
    console.error('[games.listGames]', err);
    serverError(res);
  }
}

export async function getGame(req: Request, res: Response): Promise<void> {
  try {
    const game = await Game.findOne({ slug: req.params.slug, isActive: true });
    if (!game) { notFound(res); return; }
    ok(res, game);
  } catch (err) {
    console.error('[games.getGame]', err);
    serverError(res);
  }
}
