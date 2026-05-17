import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';
import { signAccessToken } from '../utils/jwt';
import { generateOpaqueToken, hashToken } from '../utils/crypto';
import { env } from '../config/env';
import type { IUser } from '../models/User';

const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function validatePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export async function issueTokens(user: IUser, userAgent?: string, ip?: string): Promise<TokenPair> {
  const accessToken = signAccessToken(user.id as string, user.role);
  const rawRefresh = generateOpaqueToken();
  const tokenHash = hashToken(rawRefresh);
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_MS);

  await RefreshToken.create({ userId: user._id, tokenHash, expiresAt, userAgent, ip });

  return { accessToken, refreshToken: rawRefresh };
}

export async function rotateRefreshToken(
  rawToken: string,
  userAgent?: string,
  ip?: string,
): Promise<{ tokens: TokenPair; user: IUser } | null> {
  const tokenHash = hashToken(rawToken);
  const record = await RefreshToken.findOne({ tokenHash, revokedAt: { $exists: false } });

  if (!record || record.expiresAt < new Date()) {
    // Revoke all tokens for this user if record found (potential replay attack)
    if (record) await RefreshToken.updateMany({ userId: record.userId }, { revokedAt: new Date() });
    return null;
  }

  const user = await User.findById(record.userId);
  if (!user || !user.isActive) return null;

  // Revoke old token
  record.revokedAt = new Date();
  await record.save();

  const tokens = await issueTokens(user, userAgent, ip);
  return { tokens, user };
}

export async function revokeRefreshToken(rawToken: string): Promise<void> {
  const tokenHash = hashToken(rawToken);
  await RefreshToken.findOneAndUpdate({ tokenHash }, { revokedAt: new Date() });
}
