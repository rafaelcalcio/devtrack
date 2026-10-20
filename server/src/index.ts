import { createApp } from './app.js';
import { env } from './config/env.js';
import type { Db } from './db/connection.js';
import { seedDemoData } from './db/seed.js';

const app = createApp();

if (env.seedDemoData) {
  const result = seedDemoData(app.locals.db as Db);
  console.log(`[devtrack-api] ${result.message}`);
}

app.listen(env.port, () => {
  console.log(`[devtrack-api] API disponível em http://localhost:${env.port}/api`);
  console.log(`[devtrack-api] Health check: http://localhost:${env.port}/api/health`);
});
