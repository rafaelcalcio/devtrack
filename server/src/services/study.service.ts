import type { Db } from '../db/connection.js';
import { ApiError } from '../lib/errors.js';
import { toSession, toSubject, type SessionRow, type SubjectRow } from '../lib/mappers.js';
import type { StudySession, StudySubject } from '../types.js';
import { createActivityService } from './activity.service.js';

export interface SubjectInput {
  name: string;
  technology?: string;
  color?: string;
}

export interface SessionInput {
  subjectId: number;
  studiedOn: string;
  durationMinutes: number;
  notes?: string;
}

export interface SessionFilters {
  subjectId?: number;
  from?: string;
  to?: string;
}

export interface StudySummary {
  totalMinutes: number;
  totalSessions: number;
  averageSessionMinutes: number;
  bySubject: Array<{ subjectId: number; name: string; color: string; minutes: number; sessions: number }>;
  byDay: Array<{ date: string; minutes: number }>;
  subjectsCount: number;
}

export function createStudyService(db: Db) {
  const activity = createActivityService(db);

  const subjectSelect = `
    SELECT s.*,
      COALESCE((SELECT SUM(duration_minutes) FROM study_sessions ss WHERE ss.subject_id = s.id), 0) AS total_minutes,
      (SELECT COUNT(*) FROM study_sessions ss WHERE ss.subject_id = s.id) AS session_count
    FROM study_subjects s`;

  const sessionSelect = `
    SELECT ss.*, s.name AS subject_name, s.color AS subject_color
    FROM study_sessions ss
    INNER JOIN study_subjects s ON s.id = ss.subject_id`;

  function findSubject(id: number): StudySubject | null {
    const row = db.prepare(`${subjectSelect} WHERE s.id = ?`).get(id) as SubjectRow | undefined;
    return row ? toSubject(row) : null;
  }

  function findSession(id: number): StudySession | null {
    const row = db.prepare(`${sessionSelect} WHERE ss.id = ?`).get(id) as SessionRow | undefined;
    return row ? toSession(row) : null;
  }

  function assertSubjectExists(subjectId: number): void {
    const row = db.prepare(`SELECT id FROM study_subjects WHERE id = ?`).get(subjectId);
    if (!row) {
      throw ApiError.badRequest('Assunto de estudo informado não existe.', {
        fields: [{ field: 'subjectId', message: 'Assunto inexistente.' }],
      });
    }
  }

  return {
    listSubjects(): StudySubject[] {
      const rows = db
        .prepare(`${subjectSelect} ORDER BY s.name COLLATE NOCASE ASC`)
        .all() as SubjectRow[];
      return rows.map(toSubject);
    },

    getSubject: findSubject,

    createSubject(input: SubjectInput): StudySubject {
      const existing = db
        .prepare(`SELECT id FROM study_subjects WHERE name = ? COLLATE NOCASE`)
        .get(input.name);

      if (existing) {
        throw ApiError.conflict('Já existe um assunto de estudo com esse nome.');
      }

      const info = db
        .prepare(
          `INSERT INTO study_subjects (name, technology, color) VALUES (?, ?, ?)`,
        )
        .run(input.name, input.technology ?? '', input.color ?? '#6366f1');

      const id = Number(info.lastInsertRowid);
      activity.record('subject_created', `Assunto "${input.name}" cadastrado`, input.technology ?? '', 'subject', id);

      const created = findSubject(id);
      if (!created) {
        throw new ApiError(500, 'Não foi possível criar o assunto.');
      }
      return created;
    },

    updateSubject(id: number, input: Partial<SubjectInput>): StudySubject {
      const existing = findSubject(id);
      if (!existing) {
        throw ApiError.notFound('Assunto de estudo não encontrado.');
      }

      if (input.name && input.name.toLowerCase() !== existing.name.toLowerCase()) {
        const duplicated = db
          .prepare(`SELECT id FROM study_subjects WHERE name = ? COLLATE NOCASE AND id <> ?`)
          .get(input.name, id);
        if (duplicated) {
          throw ApiError.conflict('Já existe um assunto de estudo com esse nome.');
        }
      }

      const sets: string[] = [];
      const params: unknown[] = [];

      if (input.name !== undefined) {
        sets.push('name = ?');
        params.push(input.name);
      }
      if (input.technology !== undefined) {
        sets.push('technology = ?');
        params.push(input.technology);
      }
      if (input.color !== undefined) {
        sets.push('color = ?');
        params.push(input.color);
      }

      if (sets.length > 0) {
        params.push(id);
        db.prepare(`UPDATE study_subjects SET ${sets.join(', ')} WHERE id = ?`).run(...params);
      }

      const updated = findSubject(id);
      if (!updated) {
        throw ApiError.notFound('Assunto de estudo não encontrado.');
      }
      return updated;
    },

    removeSubject(id: number): void {
      const existing = db.prepare(`SELECT id FROM study_subjects WHERE id = ?`).get(id);
      if (!existing) {
        throw ApiError.notFound('Assunto de estudo não encontrado.');
      }

      db.prepare(`DELETE FROM study_subjects WHERE id = ?`).run(id);
      activity.removeForEntity('subject', id);
    },

    listSessions(filters: SessionFilters = {}): StudySession[] {
      const conditions: string[] = [];
      const params: unknown[] = [];

      if (filters.subjectId !== undefined) {
        conditions.push('ss.subject_id = ?');
        params.push(filters.subjectId);
      }
      if (filters.from) {
        conditions.push('ss.studied_on >= ?');
        params.push(filters.from);
      }
      if (filters.to) {
        conditions.push('ss.studied_on <= ?');
        params.push(filters.to);
      }

      const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const rows = db
        .prepare(`${sessionSelect} ${where} ORDER BY ss.studied_on DESC, ss.id DESC`)
        .all(...params) as SessionRow[];

      return rows.map(toSession);
    },

    getSession: findSession,

    createSession(input: SessionInput): StudySession {
      assertSubjectExists(input.subjectId);

      const info = db
        .prepare(
          `INSERT INTO study_sessions (subject_id, studied_on, duration_minutes, notes) VALUES (?, ?, ?, ?)`,
        )
        .run(input.subjectId, input.studiedOn, input.durationMinutes, input.notes ?? '');

      const id = Number(info.lastInsertRowid);
      const subject = findSubject(input.subjectId);

      activity.record(
        'study_session_logged',
        `Sessão de estudo registrada (${input.durationMinutes} min)`,
        subject?.name ?? '',
        'session',
        id,
      );

      const created = findSession(id);
      if (!created) {
        throw new ApiError(500, 'Não foi possível registrar a sessão.');
      }
      return created;
    },

    updateSession(id: number, input: Partial<SessionInput>): StudySession {
      const existing = findSession(id);
      if (!existing) {
        throw ApiError.notFound('Sessão de estudo não encontrada.');
      }

      if (input.subjectId !== undefined) {
        assertSubjectExists(input.subjectId);
      }

      const sets: string[] = [];
      const params: unknown[] = [];

      if (input.subjectId !== undefined) {
        sets.push('subject_id = ?');
        params.push(input.subjectId);
      }
      if (input.studiedOn !== undefined) {
        sets.push('studied_on = ?');
        params.push(input.studiedOn);
      }
      if (input.durationMinutes !== undefined) {
        sets.push('duration_minutes = ?');
        params.push(input.durationMinutes);
      }
      if (input.notes !== undefined) {
        sets.push('notes = ?');
        params.push(input.notes);
      }

      if (sets.length > 0) {
        params.push(id);
        db.prepare(`UPDATE study_sessions SET ${sets.join(', ')} WHERE id = ?`).run(...params);
      }

      const updated = findSession(id);
      if (!updated) {
        throw ApiError.notFound('Sessão de estudo não encontrada.');
      }
      return updated;
    },

    removeSession(id: number): void {
      const existing = db.prepare(`SELECT id FROM study_sessions WHERE id = ?`).get(id);
      if (!existing) {
        throw ApiError.notFound('Sessão de estudo não encontrada.');
      }

      db.prepare(`DELETE FROM study_sessions WHERE id = ?`).run(id);
      activity.removeForEntity('session', id);
    },

    summary(filters: SessionFilters = {}): StudySummary {
      const conditions: string[] = [];
      const params: unknown[] = [];

      if (filters.subjectId !== undefined) {
        conditions.push('ss.subject_id = ?');
        params.push(filters.subjectId);
      }
      if (filters.from) {
        conditions.push('ss.studied_on >= ?');
        params.push(filters.from);
      }
      if (filters.to) {
        conditions.push('ss.studied_on <= ?');
        params.push(filters.to);
      }

      const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const totals = db
        .prepare(
          `SELECT COALESCE(SUM(duration_minutes), 0) AS minutes, COUNT(*) AS sessions
           FROM study_sessions ss ${where}`,
        )
        .get(...params) as { minutes: number; sessions: number };

      const bySubject = db
        .prepare(
          `SELECT ss.subject_id AS subject_id, s.name AS name, s.color AS color,
                  SUM(ss.duration_minutes) AS minutes, COUNT(*) AS sessions
           FROM study_sessions ss
           INNER JOIN study_subjects s ON s.id = ss.subject_id
           ${where}
           GROUP BY ss.subject_id, s.name, s.color
           ORDER BY minutes DESC`,
        )
        .all(...params) as Array<{
        subject_id: number;
        name: string;
        color: string;
        minutes: number;
        sessions: number;
      }>;

      const byDay = db
        .prepare(
          `SELECT ss.studied_on AS date, SUM(ss.duration_minutes) AS minutes
           FROM study_sessions ss ${where}
           GROUP BY ss.studied_on
           ORDER BY ss.studied_on ASC`,
        )
        .all(...params) as Array<{ date: string; minutes: number }>;

      const subjectsCount = (
        db.prepare(`SELECT COUNT(*) AS count FROM study_subjects`).get() as { count: number }
      ).count;

      return {
        totalMinutes: totals.minutes,
        totalSessions: totals.sessions,
        averageSessionMinutes:
          totals.sessions > 0 ? Math.round(totals.minutes / totals.sessions) : 0,
        bySubject: bySubject.map((row) => ({
          subjectId: row.subject_id,
          name: row.name,
          color: row.color,
          minutes: row.minutes,
          sessions: row.sessions,
        })),
        byDay: byDay.map((row) => ({ date: row.date, minutes: row.minutes })),
        subjectsCount,
      };
    },
  };
}
