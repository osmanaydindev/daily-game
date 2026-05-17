import type { Response } from 'express';
import type { ApiResponse } from '@dail-game/types';

export function ok<T>(res: Response, data: T, message?: string): Response {
  return res.status(200).json({ success: true, data, message } satisfies ApiResponse<T>);
}

export function created<T>(res: Response, data: T): Response {
  return res.status(201).json({ success: true, data } satisfies ApiResponse<T>);
}

export function noContent(res: Response): Response {
  return res.status(204).send();
}

export function badRequest(res: Response, error: string): Response {
  return res.status(400).json({ success: false, error } satisfies ApiResponse);
}

export function unauthorized(res: Response, error = 'Unauthorized'): Response {
  return res.status(401).json({ success: false, error } satisfies ApiResponse);
}

export function forbidden(res: Response, error = 'Forbidden'): Response {
  return res.status(403).json({ success: false, error } satisfies ApiResponse);
}

export function notFound(res: Response, error = 'Not found'): Response {
  return res.status(404).json({ success: false, error } satisfies ApiResponse);
}

export function conflict(res: Response, error: string): Response {
  return res.status(409).json({ success: false, error } satisfies ApiResponse);
}

export function serverError(res: Response): Response {
  return res.status(500).json({ success: false, error: 'Internal server error' } satisfies ApiResponse);
}
