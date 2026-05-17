import { DailyEntry } from '../models/DailyEntry';
import { User } from '../models/User';
import type { PipelineStage } from 'mongoose';
import type { LeaderboardEntry, DailyLeaderboard } from '@dail-game/types';
import type { GameSlug } from '@dail-game/types';

interface EntryWithUser {
  _id: string;
  userId: { _id: string; displayName: string; avatarUrl?: string };
  gameSlug: GameSlug;
  scores: Record<string, number>;
  normalizedScore: number;
  createdAt: Date;
}

function toLeaderboardEntry(entry: EntryWithUser, rank: number): LeaderboardEntry {
  return {
    rank,
    userId: entry.userId._id.toString(),
    displayName: entry.userId.displayName,
    avatarUrl: entry.userId.avatarUrl,
    normalizedScore: entry.normalizedScore,
    rawScores: entry.scores as any,
    gameSlug: entry.gameSlug,
  };
}

export async function getDailyLeaderboard(date: string): Promise<DailyLeaderboard> {
  const entries = await DailyEntry.find({ date })
    .populate<{ userId: { _id: string; displayName: string; avatarUrl?: string } }>('userId', 'displayName avatarUrl')
    .sort({ normalizedScore: -1, createdAt: 1 })
    .lean() as unknown as EntryWithUser[];

  const wordleEntries = entries.filter((e) => e.gameSlug === 'wordle');
  const parollaEntries = entries.filter((e) => e.gameSlug === 'parolla');

  // Build combined leaderboard: for each user, average both normalized scores (0 if missing)
  const userMap = new Map<string, { wordle: number; parolla: number; displayName: string; avatarUrl?: string; earliestEntry: Date }>();

  for (const e of entries) {
    const uid = e.userId._id.toString();
    if (!userMap.has(uid)) {
      userMap.set(uid, {
        wordle: 0,
        parolla: 0,
        displayName: e.userId.displayName,
        avatarUrl: e.userId.avatarUrl,
        earliestEntry: e.createdAt,
      });
    }
    const u = userMap.get(uid)!;
    if (e.gameSlug === 'wordle') u.wordle = e.normalizedScore;
    if (e.gameSlug === 'parolla') u.parolla = e.normalizedScore;
    if (e.createdAt < u.earliestEntry) u.earliestEntry = e.createdAt;
  }

  const totalEntries: LeaderboardEntry[] = Array.from(userMap.entries())
    .map(([uid, u]) => ({
      rank: 0,
      userId: uid,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
      normalizedScore: parseFloat(((u.wordle * 0.5) + (u.parolla * 0.5)).toFixed(4)),
    }))
    .sort((a, b) => b.normalizedScore - a.normalizedScore)
    .map((e, i) => ({ ...e, rank: i + 1 }));

  return {
    date,
    wordle: wordleEntries.map(toLeaderboardEntry).map((e, i) => ({ ...e, rank: i + 1 })),
    parolla: parollaEntries.map(toLeaderboardEntry).map((e, i) => ({ ...e, rank: i + 1 })),
    total: totalEntries,
  };
}

export async function getPeriodLeaderboard(
  dateFilter: Record<string, unknown>,
  gameSlug?: GameSlug,
): Promise<LeaderboardEntry[]> {
  const matchStage: Record<string, unknown> = { ...dateFilter };
  if (gameSlug) matchStage.gameSlug = gameSlug;

  const pipeline: PipelineStage[] = [
    { $match: matchStage },
    {
      $group: {
        _id: '$userId',
        avgScore: { $avg: '$normalizedScore' },
        entryCount: { $sum: 1 },
        earliestEntry: { $min: '$createdAt' },
      },
    },
    { $sort: { avgScore: -1, earliestEntry: 1 } },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $project: {
        userId: '$_id',
        displayName: '$user.displayName',
        avatarUrl: '$user.avatarUrl',
        normalizedScore: { $round: ['$avgScore', 4] },
        entryCount: 1,
      },
    },
  ];

  const results = await DailyEntry.aggregate(pipeline);
  return results.map((r, i) => ({ ...r, rank: i + 1, userId: r.userId.toString() }));
}
