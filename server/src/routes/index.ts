import { Router } from 'express';
import type { Db } from '../db/connection.js';
import { createDashboardRouter } from './dashboard.js';
import { createGoalsRouter } from './goals.js';
import { createHealthRouter } from './health.js';
import { createProjectsRouter } from './projects.js';
import { createStudyRouter } from './study.js';
import { createTasksRouter } from './tasks.js';

export function createApiRouter(db: Db): Router {
  const router = Router();

  router.use('/health', createHealthRouter(db));
  router.use('/projects', createProjectsRouter(db));
  router.use('/tasks', createTasksRouter(db));
  router.use('/study', createStudyRouter(db));
  router.use('/goals', createGoalsRouter(db));
  router.use('/', createDashboardRouter(db));

  return router;
}
