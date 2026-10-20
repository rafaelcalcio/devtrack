import { Router } from 'express';
import type { Db } from '../db/connection.js';
import { ApiError } from '../lib/errors.js';
import { validate } from '../lib/validation.js';
import {
  createTaskService,
  type TaskFilters,
  type TaskInput,
  type TaskUpdateInput,
} from '../services/task.service.js';
import {
  idParamSchema,
  taskCreateSchema,
  taskQuerySchema,
  taskStatusSchema,
  taskUpdateSchema,
} from '../validations/schemas.js';

export function createTasksRouter(db: Db): Router {
  const router = Router();
  const service = createTaskService(db);

  router.get(
    '/',
    validate({ query: taskQuerySchema }),
    (req, res) => {
      const filters = req.valid.query as TaskFilters;
      res.json(service.list(filters));
    },
  );

  router.post(
    '/',
    validate({ body: taskCreateSchema }),
    (req, res) => {
      const input = req.valid.body as TaskInput;
      res.status(201).json(service.create(input));
    },
  );

  router.get(
    '/:id',
    validate({ params: idParamSchema }),
    (req, res) => {
      const { id } = req.valid.params as { id: number };
      const task = service.getById(id);

      if (!task) {
        throw ApiError.notFound('Tarefa não encontrada.');
      }

      res.json(task);
    },
  );

  router.patch(
    '/:id',
    validate({ params: idParamSchema, body: taskUpdateSchema }),
    (req, res) => {
      const { id } = req.valid.params as { id: number };
      const input = req.valid.body as TaskUpdateInput;
      res.json(service.update(id, input));
    },
  );

  router.put(
    '/:id',
    validate({ params: idParamSchema, body: taskUpdateSchema }),
    (req, res) => {
      const { id } = req.valid.params as { id: number };
      const input = req.valid.body as TaskUpdateInput;
      res.json(service.update(id, input));
    },
  );

  router.patch(
    '/:id/status',
    validate({ params: idParamSchema, body: taskStatusSchema }),
    (req, res) => {
      const { id } = req.valid.params as { id: number };
      const { status } = req.valid.body as { status: 'todo' | 'in_progress' | 'done' };
      res.json(service.changeStatus(id, status));
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
