import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express, { type Express } from 'express';
import { env } from './config/env.js';
import { createDatabase, type Db } from './db/connection.js';
import { migrate } from './db/schema.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { createApiRouter } from './routes/index.js';

export interface CreateAppOptions {
  database?: Db;
  databasePath?: string;
  corsOrigins?: string[];
}

const currentDir = dirname(fileURLToPath(import.meta.url));

function resolveClientDist(): string | null {
  const candidate = resolve(currentDir, '../../client/dist');

  if (existsSync(join(candidate, 'index.html'))) {
    return candidate;
  }

  return null;
}

export function createApp(options: CreateAppOptions = {}): Express {
  const db = options.database ?? createDatabase(options.databasePath ?? env.databasePath);
  migrate(db);

  const origins = new Set(options.corsOrigins ?? env.corsOrigins);

  const app = express();

  app.disable('x-powered-by');
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || origins.has(origin)) {
          callback(null, true);
          return;
        }

        callback(null, false);
      },
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false }));

  app.use('/api', createApiRouter(db));

  const clientDist = resolveClientDist();

  if (clientDist) {
    app.use(express.static(clientDist));
    app.get(/^\/(?!api\/).*/, (_req, res) => {
      res.sendFile(join(clientDist, 'index.html'));
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  app.locals.db = db;

  return app;
}
