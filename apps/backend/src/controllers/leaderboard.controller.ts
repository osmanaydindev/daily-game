import type { Request, Response } from 'express';
import { getDailyLeaderboard, getPeriodLeaderboard } from '../services/leaderboard.service';
import { todayUTC, isValidDateString, toISOWeek, toYearMonth, dateRange } from '../utils/date';
import { ok, badRequest, serverError } from '../utils/response';
import type { GameSlug } from '@dail-game/types';

export async function daily(req: Request, res: Response): Promise<void> {
  try {
    const date = (req.query.date as string) ?? todayUTC();
    if (!isValidDateString(date)) { badRequest(res, 'Invalid date'); return; }
    const data = await getDailyLeaderboard(date);
    ok(res, data);
  } catch (err) {
    console.error('[leaderboard.daily]', err);
    serverError(res);
  }
}

export async function weekly(req: Request, res: Response): Promise<void> {
  try {
    // week param format: YYYY-Www (e.g. 2025-W20)
    // or derive from a date param
    const weekParam = req.query.week as string | undefined;
    const dateParam = req.query.date as string | undefined;
    const gameSlug = req.query.game as GameSlug | undefined;

    let weekKey: string;
    if (weekParam) {
      if (!/^\d{4}-W\d{2}$/.test(weekParam)) { badRequest(res, 'Invalid week format, use YYYY-Www'); return; }
      weekKey = weekParam;
    } else {
      weekKey = toISOWeek(dateParam ?? todayUTC());
    }

    // Derive date range for the ISO week
    const [year, weekNum] = weekKey.split('-W').map(Number);
    const jan4 = new Date(Date.UTC(year, 0, 4));
    const startOfWeek = new Date(jan4);
    startOfWeek.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() || 7) - 1) + (weekNum - 1) * 7);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 6);

    const start = startOfWeek.toISOString().slice(0, 10);
    const end = endOfWeek.toISOString().slice(0, 10);

    const entries = await getPeriodLeaderboard({ date: { $gte: start, $lte: end } }, gameSlug);
    ok(res, { week: weekKey, start, end, entries });
  } catch (err) {
    console.error('[leaderboard.weekly]', err);
    serverError(res);
  }
}

export async function monthly(req: Request, res: Response): Promise<void> {
  try {
    const monthParam = (req.query.month as string) ?? toYearMonth(todayUTC());
    const gameSlug = req.query.game as GameSlug | undefined;

    if (!/^\d{4}-\d{2}$/.test(monthParam)) { badRequest(res, 'Invalid month format, use YYYY-MM'); return; }

    const [year, month] = monthParam.split('-').map(Number);
    const start = `${monthParam}-01`;
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const end = `${monthParam}-${String(lastDay).padStart(2, '0')}`;

    const entries = await getPeriodLeaderboard({ date: { $gte: start, $lte: end } }, gameSlug);
    ok(res, { month: monthParam, start, end, entries });
  } catch (err) {
    console.error('[leaderboard.monthly]', err);
    serverError(res);
  }
}
