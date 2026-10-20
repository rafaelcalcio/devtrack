import { Router } from 'express';
import type { Db } from '../db/connection.js';
import { todayISO } from '../lib/dates.js';
import { validate } from '../lib/validation.js';
import { createDashboardService } from '../services/dashboard.service.js';
import { calendarQuerySchema } from '../validations/schemas.js';

export function createDashboardRouter(db: Db): Router {
  const router = Router();
  const service = createDashboardService(db);

  router.get('/dashboard', (_req, res) => {
    res.json(service.summary());
  });

  router.get(
    '/calendar',
    validate({ query: calendarQuerySchema }),
    (req, res) => {
      const { month } = req.valid.query as { month?: string };
      res.json(service.calendar(month ?? todayISO().slice(0, 7)));
    },
  );

  return router;
}
