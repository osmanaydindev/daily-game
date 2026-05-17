import mongoose, { Document, Schema } from 'mongoose';

export interface IRefreshToken extends Document {
  userId: mongoose.Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  revokedAt?: Date;
  userAgent?: string;
  ip?: string;
  createdAt: Date;
}

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: undefined },
    userAgent: String,
    ip: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

refreshTokenSchema.index({ userId: 1 });
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index — auto-delete expired

export const RefreshToken = mongoose.model<IRefreshToken>('RefreshToken', refreshTokenSchema);
