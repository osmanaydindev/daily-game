import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { unauthorized } from '../utils/response';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    unauthorized(res);
    return;
  }

  const token = header.slice(7);
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    unauthorized(res, 'Invalid or expired token');
  }
}
