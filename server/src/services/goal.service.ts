import type { Db } from '../db/connection.js';
import { todayISO } from '../lib/dates.js';
import { ApiError } from '../lib/errors.js';
import { toGoal, type GoalRow } from '../lib/mappers.js';
import type { Goal, GoalScope, GoalStatus } from '../types.js';
import { createActivityService } from './activity.service.js';

export interface GoalFilters {
  status?: GoalStatus;
  scope?: GoalScope;
  search?: string;
}

export interface GoalInput {
  title: string;
  description?: string;
  scope?: GoalScope;
  progress?: number;
  status?: GoalStatus;
  dueDate?: string | null;
}

export type GoalUpdateInput = Partial<GoalInput>;

const UPDATE_COLUMNS: Record<string, string> = {
  title: 'title',
  description: 'description',
  scope: 'scope',
  progress: 'progress',
  status: 'status',
  dueDate: 'due_date',
};

export function createGoalService(db: Db) {
  const activity = createActivityService(db);
  const today = todayISO();

  function findById(id: number): Goal | null {
    const row = db.prepare(`SELECT * FROM goals WHERE id = ?`).get(id) as GoalRow | undefined;
    return row ? toGoal(row) : null;
  }

  function resolveProgress(progress: number | undefined, status: GoalStatus | undefined): number {
    if (status === 'completed') {
      return 100;
    }
    if (status === 'cancelled') {
      return progress ?? 0;
    }
    return progress ?? 0;
  }

  function create(input: GoalInput): Goal {
    const status = input.status ?? 'active';
    const progress = resolveProgress(input.progress, status);

    const info = db
      .prepare(
        `INSERT INTO goals (title, description, scope, progress, status, due_date, completed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        input.title,
        input.description ?? '',
        input.scope ?? 'personal',
        progress,
        status,
        input.dueDate ?? null,
        status === 'completed' ? new Date().toISOString() : null,
      );

    const id = Number(info.lastInsertRowid);
    activity.record('goal_created', `Meta "${input.title}" criada`, input.description ?? '', 'goal', id);

    const created = findById(id);
    if (!created) {
      throw new ApiError(500, 'Não foi possível criar a meta.');
    }
    return created;
  }

  function update(id: number, input: GoalUpdateInput): Goal {
    const existing = findById(id);
    if (!existing) {
      throw ApiError.notFound('Meta não encontrada.');
    }

    const sets: string[] = [];
    const params: unknown[] = [];

    for (const [key, column] of Object.entries(UPDATE_COLUMNS)) {
      if (!Object.prototype.hasOwnProperty.call(input, key)) {
        continue;
      }

      const value = (input as Record<string, unknown>)[key];
      sets.push(`${column} = ?`);
      params.push(value === undefined ? null : value);
    }

    const nextStatus = input.status ?? existing.status;
    const nextProgress = resolveProgress(input.progress ?? existing.progress, nextStatus);

    sets.push('progress = ?');
    params.push(nextProgress);

    const completedAt =
      nextStatus === 'completed'
        ? (existing.completedAt ?? new Date().toISOString())
        : null;

    sets.push('completed_at = ?');
    params.push(completedAt);
    sets.push(`updated_at = datetime('now')`);
    params.push(id);

    db.prepare(`UPDATE goals SET ${sets.join(', ')} WHERE id = ?`).run(...params);

    const updated = findById(id);
    if (!updated) {
      throw ApiError.notFound('Meta não encontrada.');
    }

    if (nextStatus === 'completed' && existing.status !== 'completed') {
      activity.record('goal_completed', `Meta "${updated.title}" concluída`, '', 'goal', id);
    }

    return updated;
  }

  function remove(id: number): void {
    const existing = db.prepare(`SELECT id FROM goals WHERE id = ?`).get(id);
    if (!existing) {
      throw ApiError.notFound('Meta não encontrada.');
    }

    db.prepare(`DELETE FROM goals WHERE id = ?`).run(id);
    activity.removeForEntity('goal', id);
  }

  return {
    list(filters: GoalFilters = {}): Goal[] {
      const conditions: string[] = [];
      const params: unknown[] = [];

      if (filters.status) {
        conditions.push('status = ?');
        params.push(filters.status);
      }
      if (filters.scope) {
        conditions.push('scope = ?');
        params.push(filters.scope);
      }
      if (filters.search) {
        conditions.push('(title LIKE ? OR description LIKE ?)');
        const like = `%${filters.search}%`;
        params.push(like, like);
      }

      const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const rows = db
        .prepare(`SELECT * FROM goals ${where} ORDER BY
            CASE status WHEN 'active' THEN 0 WHEN 'completed' THEN 1 ELSE 2 END,
            COALESCE(due_date, '9999-12-31'),
            id DESC`)
        .all(...params) as GoalRow[];

      return rows.map(toGoal);
    },

    getById: findById,

    upcoming(days = 30): Goal[] {
      const rows = db
        .prepare(
          `SELECT * FROM goals
           WHERE status = 'active' AND due_date IS NOT NULL
           ORDER BY due_date ASC`,
        )
        .all() as GoalRow[];

      const limit = new Date(`${today}T00:00:00`);
      limit.setDate(limit.getDate() + days);

      return rows
        .map(toGoal)
        .filter((goal) => goal.dueDate !== null && new Date(`${goal.dueDate}T00:00:00`) <= limit);
    },

    create,
    update,
    remove,
  };
}
