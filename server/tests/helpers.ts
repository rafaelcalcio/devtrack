import type { Express } from 'express';
import { createApp } from '../src/app.js';
import { createDatabase, IN_MEMORY_DB, type Db } from '../src/db/connection.js';

export interface TestContext {
  app: Express;
  db: Db;
}

export function createTestApp(): TestContext {
  const db = createDatabase(IN_MEMORY_DB);
  const app = createApp({
    database: db,
    corsOrigins: ['http://localhost:5173'],
  });

  return { app, db };
}
