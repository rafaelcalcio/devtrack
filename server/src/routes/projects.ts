import { Router } from 'express';
import type { Db } from '../db/connection.js';
import { ApiError } from '../lib/errors.js';
import { validate } from '../lib/validation.js';
import {
  createProjectService,
  type ProjectFilters,
  type ProjectInput,
  type ProjectUpdateInput,
} from '../services/project.service.js';
import {
  idParamSchema,
  projectCreateSchema,
  projectQuerySchema,
  projectUpdateSchema,
} from '../validations/schemas.js';

export function createProjectsRouter(db: Db): Router {
  const router = Router();
  const service = createProjectService(db);

  router.get(
    '/',
    validate({ query: projectQuerySchema }),
    (req, res) => {
      const filters = req.valid.query as ProjectFilters;
      res.json(service.list(filters));
    },
  );

  router.post(
    '/',
    validate({ body: projectCreateSchema }),
    (req, res) => {
      const input = req.valid.body as ProjectInput;
      res.status(201).json(service.create(input));
    },
  );

  router.get(
    '/:id',
    validate({ params: idParamSchema }),
    (req, res) => {
      const { id } = req.valid.params as { id: number };
      const project = service.getById(id);

      if (!project) {
        throw ApiError.notFound('Projeto não encontrado.');
      }

      res.json(project);
    },
  );

  router.patch(
    '/:id',
    validate({ params: idParamSchema, body: projectUpdateSchema }),
    (req, res) => {
      const { id } = req.valid.params as { id: number };
      const input = req.valid.body as ProjectUpdateInput;
      res.json(service.update(id, input));
    },
  );

  router.put(
    '/:id',
    validate({ params: idParamSchema, body: projectUpdateSchema }),
    (req, res) => {
      const { id } = req.valid.params as { id: number };
      const input = req.valid.body as ProjectUpdateInput;
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
