import { z } from 'zod';

const HTTPS_URL = z.string().url().regex(/^https:\/\//, 'Avatar URL must be HTTPS');

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  displayName: z.string().min(1).max(50).trim(),
  role: z.enum(['admin', 'user']).default('user'),
});

export const updateSelfSchema = z.object({
  displayName: z.string().min(1).max(50).trim().optional(),
  avatarUrl: HTTPS_URL.optional().nullable(),
});

export const adminUpdateUserSchema = z.object({
  displayName: z.string().min(1).max(50).trim().optional(),
  avatarUrl: HTTPS_URL.optional().nullable(),
  role: z.enum(['admin', 'user']).optional(),
  isActive: z.boolean().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateSelfInput = z.infer<typeof updateSelfSchema>;
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
