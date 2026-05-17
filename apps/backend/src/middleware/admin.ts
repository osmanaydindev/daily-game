import type { Request, Response, NextFunction } from 'express';
import { forbidden } from '../utils/response';

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'admin') {
    forbidden(res, 'Admin access required');
    return;
  }
  next();
}
