import mongoose, { Document, Schema } from 'mongoose';
import type { GameSlug } from '@dail-game/types';

export interface IGame extends Document {
  slug: GameSlug;
  name: string;
  officialUrl: string;
  scoreFields: { name: string; type: string; label: string; min?: number; max?: number }[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const gameSchema = new Schema<IGame>(
  {
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    officialUrl: { type: String, required: true },
    scoreFields: [
      {
        name: { type: String, required: true },
        type: { type: String, required: true, enum: ['number', 'boolean'] },
        label: { type: String, required: true },
        min: Number,
        max: Number,
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Game = mongoose.model<IGame>('Game', gameSchema);
