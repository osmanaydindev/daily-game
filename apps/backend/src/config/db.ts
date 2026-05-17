import mongoose from 'mongoose';
import { env } from './env';

export async function connectDb(): Promise<void> {
  mongoose.connection.on('error', (err) => console.error('MongoDB error:', err));
  await mongoose.connect(env.MONGODB_URI);
  console.log('✅ MongoDB connected');
}
