import { z } from 'zod';

const wordleScores = z.object({
  attempt: z.number().int().min(1).max(7), // 7 = DNF
});

const parollaScores = z.object({
  correct: z.number().int().min(0),
  wrong: z.number().int().min(0),
  blank: z.number().int().min(0),
});

export const submitEntrySchema = z.object({
  gameSlug: z.enum(['wordle', 'parolla']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
  scores: z.union([wordleScores, parollaScores]),
});

export const adminUpdateEntrySchema = z.object({
  scores: z.union([wordleScores, parollaScores]),
});

export type SubmitEntryInput = z.infer<typeof submitEntrySchema>;
export type AdminUpdateEntryInput = z.infer<typeof adminUpdateEntrySchema>;
