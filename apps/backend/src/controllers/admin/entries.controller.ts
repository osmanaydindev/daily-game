import type { Request, Response } from 'express';
import { DailyEntry } from '../../models/DailyEntry';
import { computeNormalizedScore } from '../../config/gameConfig';
import { ok, notFound, serverError } from '../../utils/response';
import type { AdminUpdateEntryInput } from '../../validation/entry.schemas';
import type { GameSlug } from '@dail-game/types';

export async function listAllEntries(req: Request, res: Response): Promise<void> {
  try {
    const { date, gameSlug, userId } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = {};
    if (date) filter.date = date;
    if (gameSlug) filter.gameSlug = gameSlug;
    if (userId) filter.userId = userId;

    const entries = await DailyEntry.find(filter)
      .populate('userId', 'displayName email')
      .populate('gameId', 'name slug')
      .sort({ date: -1, createdAt: -1 })
      .limit(500);
    ok(res, entries);
  } catch (err) {
    console.error('[admin.entries.list]', err);
    serverError(res);
  }
}

export async function updateEntry(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { scores } = req.body as AdminUpdateEntryInput;

    const entry = await DailyEntry.findById(id);
    if (!entry) { notFound(res); return; }

    const normalizedScore = computeNormalizedScore(entry.gameSlug as GameSlug, scores as Record<string, number>);
    entry.scores = scores as Record<string, number>;
    entry.normalizedScore = normalizedScore;
    entry.updatedBy = req.user!.id as any;
    await entry.save();

    ok(res, entry);
  } catch (err) {
    console.error('[admin.entries.update]', err);
    serverError(res);
  }
}

export async function getDashboardStats(req: Request, res: Response): Promise<void> {
  try {
    const [totalUsers, totalEntries, activeUsers] = await Promise.all([
      (await import('../../models/User')).User.countDocuments(),
      DailyEntry.countDocuments(),
      (await import('../../models/User')).User.countDocuments({ isActive: true }),
    ]);
    ok(res, { totalUsers, totalEntries, activeUsers });
  } catch (err) {
    console.error('[admin.stats]', err);
    serverError(res);
  }
}
