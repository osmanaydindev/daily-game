import mongoose, { Document, Schema } from 'mongoose';

export interface IDailyEntry extends Document {
  userId: mongoose.Types.ObjectId;
  gameId: mongoose.Types.ObjectId;
  gameSlug: string;
  date: string; // YYYY-MM-DD UTC
  scores: Record<string, number>;
  normalizedScore: number;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const dailyEntrySchema = new Schema<IDailyEntry>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    gameId: { type: Schema.Types.ObjectId, ref: 'Game', required: true },
    gameSlug: { type: String, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    scores: { type: Schema.Types.Mixed, required: true },
    normalizedScore: { type: Number, required: true, min: 0, max: 1 },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: undefined },
  },
  { timestamps: true },
);

// Enforce one entry per user per game per day at DB level
dailyEntrySchema.index({ userId: 1, gameId: 1, date: 1 }, { unique: true });

// Query indexes
dailyEntrySchema.index({ date: 1, gameSlug: 1 });
dailyEntrySchema.index({ userId: 1, date: 1 });
dailyEntrySchema.index({ normalizedScore: -1 });

export const DailyEntry = mongoose.model<IDailyEntry>('DailyEntry', dailyEntrySchema);
