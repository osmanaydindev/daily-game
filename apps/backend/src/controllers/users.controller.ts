import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { User } from '../models/User';
import { validatePassword, hashPassword } from '../services/auth.service';
import { ok, notFound, serverError, badRequest, conflict } from '../utils/response';
import type { UpdateSelfInput, ChangePasswordInput } from '../validation/user.schemas';
import { env } from '../config/env';

function userPayload(user: InstanceType<typeof User>) {
  return {
    _id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) { notFound(res); return; }
    ok(res, userPayload(user));
  } catch (err) {
    console.error('[users.getMe]', err);
    serverError(res);
  }
}

export async function updateMe(req: Request, res: Response): Promise<void> {
  try {
    const { username, displayName, avatarUrl } = req.body as UpdateSelfInput;

    if (username) {
      const existing = await User.findOne({ username, _id: { $ne: req.user!.id } });
      if (existing) { conflict(res, 'Username already taken'); return; }
    }

    const user = await User.findByIdAndUpdate(
      req.user!.id,
      {
        ...(username && { username }),
        ...(displayName && { displayName }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
      { new: true },
    );
    if (!user) { notFound(res); return; }
    ok(res, userPayload(user));
  } catch (err) {
    console.error('[users.updateMe]', err);
    serverError(res);
  }
}

export async function uploadAvatar(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) { badRequest(res, 'No file uploaded'); return; }

    const user = await User.findById(req.user!.id);
    if (!user) { notFound(res); return; }

    // Delete old uploaded avatar (ignore URL-based avatars)
    if (user.avatarUrl) {
      const oldPath = path.join(process.cwd(), 'uploads', 'avatars', path.basename(user.avatarUrl));
      if (user.avatarUrl.includes('/api/uploads/avatars/') && fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    const avatarUrl = `${env.BACKEND_URL}/api/uploads/avatars/${req.file.filename}`;
    user.avatarUrl = avatarUrl;
    await user.save();

    ok(res, userPayload(user));
  } catch (err) {
    console.error('[users.uploadAvatar]', err);
    serverError(res);
  }
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  try {
    const { currentPassword, newPassword } = req.body as ChangePasswordInput;

    const user = await User.findById(req.user!.id).select('+passwordHash');
    if (!user) { notFound(res); return; }

    const valid = await validatePassword(currentPassword, user.passwordHash);
    if (!valid) { badRequest(res, 'Current password is incorrect'); return; }

    user.passwordHash = await hashPassword(newPassword);
    await user.save();

    ok(res, null, 'Password changed successfully');
  } catch (err) {
    console.error('[users.changePassword]', err);
    serverError(res);
  }
}
