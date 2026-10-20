import { Router } from 'express';
import type { Db } from '../db/connection.js';
import { ApiError } from '../lib/errors.js';
import { validate } from '../lib/validation.js';
import {
  createGoalService,
  type GoalFilters,
  type GoalInput,
  type GoalUpdateInput,
} from '../services/goal.service.js';
import {
  goalCreateSchema,
  goalQuerySchema,
  goalUpdateSchema,
  idParamSchema,
} from '../validations/schemas.js';

export function createGoalsRouter(db: Db): Router {
  const router = Router();
  const service = createGoalService(db);

  router.get(
    '/',
    validate({ query: goalQuerySchema }),
    (req, res) => {
      const filters = req.valid.query as GoalFilters;
      res.json(service.list(filters));
    },
  );

  router.post(
    '/',
    validate({ body: goalCreateSchema }),
    (req, res) => {
      const input = req.valid.body as GoalInput;
      res.status(201).json(service.create(input));
    },
  );

  router.get(
    '/:id',
    validate({ params: idParamSchema }),
    (req, res) => {
      const { id } = req.valid.params as { id: number };
      const goal = service.getById(id);

      if (!goal) {
        throw ApiError.notFound('Meta não encontrada.');
      }

      res.json(goal);
    },
  );

  router.patch(
    '/:id',
    validate({ params: idParamSchema, body: goalUpdateSchema }),
    (req, res) => {
      const { id } = req.valid.params as { id: number };
      const input = req.valid.body as GoalUpdateInput;
      res.json(service.update(id, input));
    },
  );

  router.put(
    '/:id',
    validate({ params: idParamSchema, body: goalUpdateSchema }),
    (req, res) => {
      const { id } = req.valid.params as { id: number };
      const input = req.valid.body as GoalUpdateInput;
      res.json(service.update(id, input));
    },
  );

  router.delete(
    '/:id',
    validate({ params: idParamSchema }),
    (req, res) => {
      const { id } = req.valid.params as { id: number };
      service.remove(id);
      res.status(204).send();
    },
  );

  return router;
}
