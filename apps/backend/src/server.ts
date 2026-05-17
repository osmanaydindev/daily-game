import { env } from './config/env';
import { connectDb } from './config/db';
import app from './app';

async function start(): Promise<void> {
  await connectDb();
  app.listen(env.PORT, () => {
    console.log(`🚀 API running on port ${env.PORT} [${env.NODE_ENV}]`);
  });
}

start().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
