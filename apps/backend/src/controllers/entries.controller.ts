import type { Request, Response } from 'express';
import { DailyEntry } from '../models/DailyEntry';
import { Game } from '../models/Game';
import { computeNormalizedScore } from '../config/gameConfig';
import { todayUTC, isValidDateString } from '../utils/date';
import { ok, created, badRequest, conflict, notFound, serverError } from '../utils/response';
import type { SubmitEntryInput } from '../validation/entry.schemas';
import type { GameSlug } from '@dail-game/types';

export async function submitEntry(req: Request, res: Response): Promise<void> {
  try {
    const { gameSlug, scores, date: reqDate } = req.body as SubmitEntryInput;
    const date = reqDate ?? todayUTC();

    if (!isValidDateString(date)) {
      badRequest(res, 'Invalid date format');
      return;
    }

    // Prevent future entries
    if (date > todayUTC()) {
      badRequest(res, 'Cannot submit entries for future dates');
      return;
    }

    const game = await Game.findOne({ slug: gameSlug, isActive: true });
    if (!game) { notFound(res, 'Game not found'); return; }

    const normalizedScore = computeNormalizedScore(gameSlug as GameSlug, scores as Record<string, number>);

    try {
      const entry = await DailyEntry.create({
        userId: req.user!.id,
        gameId: game._id,
        gameSlug,
        date,
        scores,
        normalizedScore,
      });
      created(res, entry);
    } catch (err: any) {
      if (err.code === 11000) {
        conflict(res, 'You have already submitted an entry for this game today');
        return;
      }
      throw err;
    }
  } catch (err) {
    console.error('[entries.submit]', err);
    serverError(res);
  }
}

export async function listMyEntries(req: Request, res: Response): Promise<void> {
  try {
    const { gameSlug, from, to } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = { userId: req.user!.id };
    if (gameSlug) filter.gameSlug = gameSlug;
    if (from || to) {
      filter.date = {
        ...(from && { $gte: from }),
        ...(to && { $lte: to }),
      };
    }

    const entries = await DailyEntry.find(filter).sort({ date: -1 }).limit(100);
    ok(res, entries);
  } catch (err) {
    console.error('[entries.listMine]', err);
    serverError(res);
  }
}
