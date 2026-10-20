import { Router } from 'express';
import type { Db } from '../db/connection.js';
import { ApiError } from '../lib/errors.js';
import { validate } from '../lib/validation.js';
import {
  createStudyService,
  type SessionFilters,
  type SessionInput,
  type SubjectInput,
} from '../services/study.service.js';
import {
  idParamSchema,
  sessionCreateSchema,
  sessionQuerySchema,
  sessionUpdateSchema,
  subjectCreateSchema,
  subjectUpdateSchema,
} from '../validations/schemas.js';

export function createStudyRouter(db: Db): Router {
  const router = Router();
  const service = createStudyService(db);

  router.get('/subjects', (_req, res) => {
    res.json(service.listSubjects());
  });

  router.post(
    '/subjects',
    validate({ body: subjectCreateSchema }),
    (req, res) => {
      const input = req.valid.body as SubjectInput;
      res.status(201).json(service.createSubject(input));
    },
  );

  router.get(
    '/subjects/:id',
    validate({ params: idParamSchema }),
    (req, res) => {
      const { id } = req.valid.params as { id: number };
      const subject = service.getSubject(id);

      if (!subject) {
        throw ApiError.notFound('Assunto de estudo não encontrado.');
      }

      res.json(subject);
    },
  );

  router.patch(
    '/subjects/:id',
    validate({ params: idParamSchema, body: subjectUpdateSchema }),
    (req, res) => {
      const { id } = req.valid.params as { id: number };
      const input = req.valid.body as Partial<SubjectInput>;
      res.json(service.updateSubject(id, input));
    },
  );

  router.delete(
    '/subjects/:id',
    validate({ params: idParamSchema }),
    (req, res) => {
      const { id } = req.valid.params as { id: number };
      service.removeSubject(id);
      res.status(204).send();
    },
  );

  router.get(
    '/sessions',
    validate({ query: sessionQuerySchema }),
    (req, res) => {
      const filters = req.valid.query as SessionFilters;
      res.json(service.listSessions(filters));
    },
  );

  router.post(
    '/sessions',
    validate({ body: sessionCreateSchema }),
    (req, res) => {
      const input = req.valid.body as SessionInput;
      res.status(201).json(service.createSession(input));
    },
  );

  router.get(
    '/sessions/:id',
    validate({ params: idParamSchema }),
    (req, res) => {
      const { id } = req.valid.params as { id: number };
      const session = service.getSession(id);

      if (!session) {
        throw ApiError.notFound('Sessão de estudo não encontrada.');
      }

      res.json(session);
    },
  );

  router.patch(
    '/sessions/:id',
    validate({ params: idParamSchema, body: sessionUpdateSchema }),
    (req, res) => {
      const { id } = req.valid.params as { id: number };
      const input = req.valid.body as Partial<SessionInput>;
      res.json(service.updateSession(id, input));
    },
  );

  router.delete(
    '/sessions/:id',
    validate({ params: idParamSchema }),
    (req, res) => {
      const { id } = req.valid.params as { id: number };
      service.removeSession(id);
      res.status(204).send();
    },
  );

  router.get(
    '/summary',
    validate({ query: sessionQuerySchema }),
    (req, res) => {
      const filters = req.valid.query as SessionFilters;
      res.json(service.summary(filters));
    },
  );

  return router;
}
