import { Router } from 'express';
import type { Db } from '../db/connection.js';

export function createHealthRouter(db: Db): Router {
  const router = Router();
  const startedAt = Date.now();

  router.get('/', (_req, res) => {
    const databaseOk = db.open === true;

    res.status(databaseOk ? 200 : 503).json({
      status: databaseOk ? 'ok' : 'degraded',
      service: 'devtrack-api',
      version: '1.0.0',
      uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
      database: databaseOk ? 'connected' : 'unavailable',
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
