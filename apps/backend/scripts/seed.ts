/**
 * Seed script — idempotent, safe to run multiple times.
 * Creates the admin user and initial game records from env vars.
 *
 * Usage: npm run seed (from apps/backend)
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { env } from '../src/config/env';
import { User } from '../src/models/User';
import { Game } from '../src/models/Game';
import { GAME_CONFIG } from '../src/config/gameConfig';
import { hashPassword } from '../src/services/auth.service';

async function seed(): Promise<void> {
  await mongoose.connect(env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  // ─── Seed admin ───────────────────────────────────────────────────────────
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD || !env.ADMIN_DISPLAY_NAME) {
    console.error('❌ ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_DISPLAY_NAME must be set in .env');
    process.exit(1);
  }

  const existingAdmin = await User.findOne({ email: env.ADMIN_EMAIL.toLowerCase() });
  if (existingAdmin) {
    console.log(`ℹ️  Admin already exists: ${env.ADMIN_EMAIL}`);
  } else {
    const passwordHash = await hashPassword(env.ADMIN_PASSWORD);
    await User.create({
      email: env.ADMIN_EMAIL.toLowerCase(),
      displayName: env.ADMIN_DISPLAY_NAME,
      passwordHash,
      role: 'admin',
    });
    console.log(`✅ Admin created: ${env.ADMIN_EMAIL}`);
  }

  // ─── Seed games ───────────────────────────────────────────────────────────
  for (const config of Object.values(GAME_CONFIG)) {
    const existing = await Game.findOne({ slug: config.slug });
    if (existing) {
      console.log(`ℹ️  Game already exists: ${config.slug}`);
    } else {
      await Game.create({
        slug: config.slug,
        name: config.name,
        officialUrl: config.officialUrl,
        scoreFields: config.scoreFields,
        isActive: true,
      });
      console.log(`✅ Game created: ${config.slug} (${config.name})`);
    }
  }

  await mongoose.disconnect();
  console.log('✅ Seed complete');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
