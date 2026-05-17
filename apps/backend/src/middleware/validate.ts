import type { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { badRequest } from '../utils/response';

export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const issues = (result.error as ZodError).issues.map((i) => `${i.path.join('.')}: ${i.message}`);
      badRequest(res, issues.join('; '));
      return;
    }
    req[source] = result.data;
    next();
  };
}
