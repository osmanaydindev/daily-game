import type { GameSlug, WordleScores, ParollaScores } from '@dail-game/types';

interface GameConfig {
  slug: GameSlug;
  name: string;
  officialUrl: string;
  scoreFields: { name: string; type: 'number' | 'boolean'; label: string; min?: number; max?: number }[];
  normalize(scores: Record<string, number>): number;
}

// Wordle: attempt 1–6 (lower = better), DNF = 7
// Formula: (7 - attempt) / 6  → [0.167, 1.0] for valid attempts, 0 for DNF
function normalizeWordle(scores: Record<string, number>): number {
  const attempt = scores['attempt'] ?? 7;
  if (attempt < 1 || attempt > 7) return 0;
  return (7 - attempt) / 6;
}

// Parolla: correct / (correct + wrong + blank)  → [0.0, 1.0]
function normalizeParolla(scores: Record<string, number>): number {
  const correct = scores['correct'] ?? 0;
  const wrong = scores['wrong'] ?? 0;
  const blank = scores['blank'] ?? 0;
  const total = correct + wrong + blank;
  if (total === 0) return 0;
  return correct / total;
}

export const GAME_CONFIG: Record<GameSlug, GameConfig> = {
  wordle: {
    slug: 'wordle',
    name: 'Wordle',
    officialUrl: 'https://www.nytimes.com/games/wordle/index.html',
    scoreFields: [
      { name: 'attempt', type: 'number', label: 'Solved in attempt #', min: 1, max: 7 },
    ],
    normalize: normalizeWordle,
  },
  parolla: {
    slug: 'parolla',
    name: 'Parolla',
    officialUrl: 'https://parolla.app',
    scoreFields: [
      { name: 'correct', type: 'number', label: 'Correct', min: 0, max: 100 },
      { name: 'wrong', type: 'number', label: 'Wrong', min: 0, max: 100 },
      { name: 'blank', type: 'number', label: 'Blank', min: 0, max: 100 },
    ],
    normalize: normalizeParolla,
  },
};

export function computeNormalizedScore(slug: GameSlug, scores: Record<string, number>): number {
  const config = GAME_CONFIG[slug];
  if (!config) throw new Error(`Unknown game slug: ${slug}`);
  const score = config.normalize(scores);
  // Clamp to [0, 1] for safety
  return Math.min(1, Math.max(0, score));
}
