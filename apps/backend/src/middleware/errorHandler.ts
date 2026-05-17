import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { env } from '../config/env';

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // Log full error server-side
  console.error('[error]', err.message, err.stack);

  // Never leak internals to client
  const message = env.NODE_ENV === 'development' ? err.message : 'Internal server error';
  res.status(500).json({ success: false, error: message });
};
