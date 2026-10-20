import type { Db } from '../db/connection.js';
import { ApiError } from '../lib/errors.js';
import { todayISO } from '../lib/dates.js';
import { toProject, type ProjectRow, type ProjectStatsRow } from '../lib/mappers.js';
import type { Priority, Project, ProjectStatus, ProjectWithStats } from '../types.js';
import { createActivityService } from './activity.service.js';

export interface ProjectFilters {
  status?: ProjectStatus;
  priority?: Priority;
  category?: string;
  search?: string;
}

export interface ProjectInput {
  name: string;
  description?: string;
  category?: string;
  status?: ProjectStatus;
  priority?: Priority;
  color?: string;
  startDate?: string | null;
  dueDate?: string | null;
}

export type ProjectUpdateInput = Partial<Omit<ProjectInput, 'name'>> & { name?: string };

const UPDATE_COLUMNS: Record<string, string> = {
  name: 'name',
  description: 'description',
  category: 'category',
  status: 'status',
  priority: 'priority',
  color: 'color',
  startDate: 'start_date',
  dueDate: 'due_date',
};

export function calculateProgress(totalTasks: number, completedTasks: number): number {
  if (totalTasks <= 0) {
    return 0;
  }

  return Math.round((completedTasks / totalTasks) * 100);
}

export function createProjectService(db: Db) {
  const activity = createActivityService(db);
  const today = todayISO();

  const statsColumns = `
    (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) AS total_tasks,
    (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'done') AS completed_tasks,
    (SELECT COUNT(*) FROM tasks t
      WHERE t.project_id = p.id
        AND t.status <> 'done'
        AND t.due_date IS NOT NULL
        AND t.due_date < ?) AS overdue_tasks`;

  function toStats(row: ProjectStatsRow): ProjectWithStats {
    return {
      ...toProject(row),
      totalTasks: row.total_tasks,
      completedTasks: row.completed_tasks,
      overdueTasks: row.overdue_tasks,
      progress: calculateProgress(row.total_tasks, row.completed_tasks),
    };
  }

  function findById(id: number): ProjectWithStats | null {
    const row = db
      .prepare(`SELECT p.*, ${statsColumns} FROM projects p WHERE p.id = ?`)
      .get(today, id) as ProjectStatsRow | undefined;

    return row ? toStats(row) : null;
  }

  return {
    list(filters: ProjectFilters = {}): ProjectWithStats[] {
      const conditions: string[] = [];
      const params: unknown[] = [today];

      if (filters.status) {
        conditions.push('p.status = ?');
        params.push(filters.status);
      }

      if (filters.priority) {
        conditions.push('p.priority = ?');
        params.push(filters.priority);
      }

      if (filters.category) {
        conditions.push('p.category = ?');
        params.push(filters.category);
      }

      if (filters.search) {
        conditions.push('(p.name LIKE ? OR p.description LIKE ?)');
        const like = `%${filters.search}%`;
        params.push(like, like);
      }

      const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const rows = db
        .prepare(`SELECT p.*, ${statsColumns} FROM projects p ${where} ORDER BY p.updated_at DESC, p.id DESC`)
        .all(...params) as ProjectStatsRow[];

      return rows.map(toStats);
    },

    getById: findById,

    exists(id: number): boolean {
      const row = db.prepare(`SELECT id FROM projects WHERE id = ?`).get(id);
      return row !== undefined;
    },

    create(input: ProjectInput): ProjectWithStats {
      const info = db
        .prepare(
          `INSERT INTO projects (name, description, category, status, priority, color, start_date, due_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          input.name,
          input.description ?? '',
          input.category ?? 'Geral',
          input.status ?? 'planning',
          input.priority ?? 'medium',
          input.color ?? '#6366f1',
          input.startDate ?? null,
          input.dueDate ?? null,
        );

      const id = Number(info.lastInsertRowid);
      activity.record('project_created', `Projeto "${input.name}" criado`, input.description ?? '', 'project', id);

      const created = findById(id);
      if (!created) {
        throw new ApiError(500, 'Não foi possível criar o projeto.');
      }

      return created;
    },

    update(id: number, input: ProjectUpdateInput): ProjectWithStats {
      const existing = findById(id);
      if (!existing) {
        throw ApiError.notFound('Projeto não encontrado.');
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

      if (sets.length > 0) {
        sets.push(`updated_at = datetime('now')`);
        params.push(id);

        db.prepare(`UPDATE projects SET ${sets.join(', ')} WHERE id = ?`).run(...params);
      }

      const updated = findById(id);
      if (!updated) {
        throw ApiError.notFound('Projeto não encontrado.');
      }

      if (input.status === 'completed' && existing.status !== 'completed') {
        activity.record('project_completed', `Projeto "${updated.name}" concluído`, '', 'project', id);
      }

      return updated;
    },

    remove(id: number): void {
      const existing = db.prepare(`SELECT id, name FROM projects WHERE id = ?`).get(id) as
        | { id: number; name: string }
        | undefined;

      if (!existing) {
        throw ApiError.notFound('Projeto não encontrado.');
      }

      const remove = db.transaction(() => {
        db.prepare(`DELETE FROM tasks WHERE project_id = ?`).run(id);
        db.prepare(`DELETE FROM projects WHERE id = ?`).run(id);
        activity.removeForEntity('project', id);
      });

      remove();
    },

    raw(): Project[] {
      const rows = db.prepare(`SELECT * FROM projects ORDER BY id DESC`).all() as ProjectRow[];
      return rows.map(toProject);
    },
  };
}
