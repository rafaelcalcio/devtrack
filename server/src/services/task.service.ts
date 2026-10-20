import type { Db } from '../db/connection.js';
import { todayISO } from '../lib/dates.js';
import { ApiError } from '../lib/errors.js';
import { toTask, type TaskRow } from '../lib/mappers.js';
import type { Priority, Task, TaskStatus } from '../types.js';
import { createActivityService } from './activity.service.js';

export interface TaskFilters {
  projectId?: number;
  status?: TaskStatus;
  priority?: Priority;
  category?: string;
  search?: string;
  overdue?: boolean;
}

export interface TaskInput {
  title: string;
  description?: string;
  projectId?: number | null;
  status?: TaskStatus;
  priority?: Priority;
  category?: string;
  dueDate?: string | null;
}

export type TaskUpdateInput = Partial<TaskInput>;

const UPDATE_COLUMNS: Record<string, string> = {
  title: 'title',
  description: 'description',
  projectId: 'project_id',
  status: 'status',
  priority: 'priority',
  category: 'category',
  dueDate: 'due_date',
};

export function createTaskService(db: Db) {
  const activity = createActivityService(db);
  const today = todayISO();

  const baseSelect = `
    SELECT t.*, p.name AS project_name, p.color AS project_color
    FROM tasks t
    LEFT JOIN projects p ON p.id = t.project_id`;

  function findById(id: number): Task | null {
    const row = db.prepare(`${baseSelect} WHERE t.id = ?`).get(id) as TaskRow | undefined;
    return row ? toTask(row, today) : null;
  }

  function assertProjectExists(projectId: number | null | undefined): void {
    if (projectId === null || projectId === undefined) {
      return;
    }

    const row = db.prepare(`SELECT id FROM projects WHERE id = ?`).get(projectId);
    if (!row) {
      throw ApiError.badRequest('Projeto informado não existe.', {
        fields: [{ field: 'projectId', message: 'Projeto inexistente.' }],
      });
    }
  }

  function list(filters: TaskFilters = {}): Task[] {
      const conditions: string[] = [];
      const params: unknown[] = [];

      if (filters.projectId !== undefined) {
        conditions.push('t.project_id = ?');
        params.push(filters.projectId);
      }

      if (filters.status) {
        conditions.push('t.status = ?');
        params.push(filters.status);
      }

      if (filters.priority) {
        conditions.push('t.priority = ?');
        params.push(filters.priority);
      }

      if (filters.category) {
        conditions.push('t.category = ?');
        params.push(filters.category);
      }

      if (filters.search) {
        conditions.push('(t.title LIKE ? OR t.description LIKE ?)');
        const like = `%${filters.search}%`;
        params.push(like, like);
      }

      if (filters.overdue === true) {
        conditions.push(`t.status <> 'done' AND t.due_date IS NOT NULL AND t.due_date < ?`);
        params.push(today);
      }

      const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const rows = db
        .prepare(
          `${baseSelect} ${where}
           ORDER BY
             CASE t.status WHEN 'in_progress' THEN 0 WHEN 'todo' THEN 1 ELSE 2 END,
             CASE t.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
             COALESCE(t.due_date, '9999-12-31'),
             t.id DESC`,
        )
        .all(...params) as TaskRow[];

      return rows.map((row) => toTask(row, today));
  }

  function create(input: TaskInput): Task {
    assertProjectExists(input.projectId);

    const status = input.status ?? 'todo';
    const info = db
      .prepare(
        `INSERT INTO tasks (title, description, project_id, status, priority, category, due_date, completed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        input.title,
        input.description ?? '',
        input.projectId ?? null,
        status,
        input.priority ?? 'medium',
        input.category ?? 'Geral',
        input.dueDate ?? null,
        status === 'done' ? new Date().toISOString() : null,
      );

    const id = Number(info.lastInsertRowid);
    activity.record('task_created', `Tarefa "${input.title}" criada`, '', 'task', id);

    const created = findById(id);
    if (!created) {
      throw new ApiError(500, 'Não foi possível criar a tarefa.');
    }

    return created;
  }

  function update(id: number, input: TaskUpdateInput): Task {
    const existing = findById(id);
    if (!existing) {
      throw ApiError.notFound('Tarefa não encontrada.');
    }

    if (Object.prototype.hasOwnProperty.call(input, 'projectId')) {
      assertProjectExists(input.projectId);
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

    const nextStatus = input.status;

    if (nextStatus !== undefined && nextStatus !== existing.status) {
      sets.push('completed_at = ?');
      params.push(nextStatus === 'done' ? new Date().toISOString() : null);
    }

    if (sets.length > 0) {
      sets.push(`updated_at = datetime('now')`);
      params.push(id);

      db.prepare(`UPDATE tasks SET ${sets.join(', ')} WHERE id = ?`).run(...params);
    }

    const updated = findById(id);
    if (!updated) {
      throw ApiError.notFound('Tarefa não encontrada.');
    }

    if (nextStatus === 'done' && existing.status !== 'done') {
      activity.record('task_completed', `Tarefa "${updated.title}" concluída`, '', 'task', id);
    } else if (nextStatus !== undefined && nextStatus !== existing.status) {
      activity.record('task_updated', `Tarefa "${updated.title}" movida para ${nextStatus}`, '', 'task', id);
    }

    return updated;
  }

  function remove(id: number): void {
    const existing = db.prepare(`SELECT id, title FROM tasks WHERE id = ?`).get(id) as
      | { id: number; title: string }
      | undefined;

    if (!existing) {
      throw ApiError.notFound('Tarefa não encontrada.');
    }

    db.prepare(`DELETE FROM tasks WHERE id = ?`).run(id);
    activity.removeForEntity('task', id);
  }

  return {
    list,
    getById: findById,
    create,
    update,
    changeStatus(id: number, status: TaskStatus): Task {
      return update(id, { status });
    },
    remove,
  };
}
