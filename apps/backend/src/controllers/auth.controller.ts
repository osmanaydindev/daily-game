import type { Request, Response } from 'express';
import { User } from '../models/User';
import { validatePassword, issueTokens, rotateRefreshToken, revokeRefreshToken } from '../services/auth.service';
import { ok, unauthorized, serverError } from '../utils/response';
import { env } from '../config/env';

const COOKIE_NAME = '__refresh';

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: env.REFRESH_TOKEN_TTL_MS,
  path: '/api/auth',
};

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body as { email: string; password: string };

    const user = await User.findOne({ email: email.toLowerCase(), isActive: true }).select('+passwordHash');
    if (!user) {
      unauthorized(res, 'Invalid credentials');
      return;
    }

    const valid = await validatePassword(password, user.passwordHash);
    if (!valid) {
      unauthorized(res, 'Invalid credentials');
      return;
    }

    const { accessToken, refreshToken } = await issueTokens(
      user,
      req.headers['user-agent'],
      req.ip,
    );

    res.cookie(COOKIE_NAME, refreshToken, cookieOptions);
    ok(res, {
      user: {
        _id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        role: user.role,
        createdAt: user.createdAt,
      },
      accessToken,
    });
  } catch (err) {
    console.error('[auth.login]', err);
    serverError(res);
  }
}

export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    const rawToken = req.cookies?.[COOKIE_NAME] as string | undefined;
    if (!rawToken) {
      unauthorized(res, 'No refresh token');
      return;
    }

    const result = await rotateRefreshToken(rawToken, req.headers['user-agent'], req.ip);
    if (!result) {
      res.clearCookie(COOKIE_NAME, { path: '/api/auth' });
      unauthorized(res, 'Invalid or expired refresh token');
      return;
    }

    const { tokens, user } = result;
    res.cookie(COOKIE_NAME, tokens.refreshToken, cookieOptions);
    ok(res, { accessToken: tokens.accessToken });
  } catch (err) {
    console.error('[auth.refresh]', err);
    serverError(res);
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  try {
    const rawToken = req.cookies?.[COOKIE_NAME] as string | undefined;
    if (rawToken) await revokeRefreshToken(rawToken);
    res.clearCookie(COOKIE_NAME, { path: '/api/auth' });
    ok(res, null, 'Logged out');
  } catch (err) {
    console.error('[auth.logout]', err);
    serverError(res);
  }
}
