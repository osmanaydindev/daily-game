import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import type { Role } from '@dail-game/types';

export interface AccessTokenPayload {
  sub: string; // userId
  role: Role;
  iat?: number;
  exp?: number;
}

export function signAccessToken(userId: string, role: Role): string {
  return jwt.sign({ sub: userId, role }, env.ACCESS_TOKEN_SECRET, {
    expiresIn: Math.floor(env.ACCESS_TOKEN_TTL_MS / 1000),
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.ACCESS_TOKEN_SECRET) as AccessTokenPayload;
}
