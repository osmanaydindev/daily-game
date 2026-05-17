import type { Request, Response } from 'express';
import { User } from '../models/User';
import { ok, notFound, serverError } from '../utils/response';
import type { UpdateSelfInput } from '../validation/user.schemas';

export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) { notFound(res); return; }
    ok(res, {
      _id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error('[users.getMe]', err);
    serverError(res);
  }
}

export async function updateMe(req: Request, res: Response): Promise<void> {
  try {
    const { displayName, avatarUrl } = req.body as UpdateSelfInput;
    const user = await User.findByIdAndUpdate(
      req.user!.id,
      { ...(displayName && { displayName }), ...(avatarUrl !== undefined && { avatarUrl }) },
      { new: true },
    );
    if (!user) { notFound(res); return; }
    ok(res, {
      _id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error('[users.updateMe]', err);
    serverError(res);
  }
}
