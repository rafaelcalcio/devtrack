import type { Db } from '../db/connection.js';
import { toActivity, type ActivityRow } from '../lib/mappers.js';
import type { Activity } from '../types.js';

export type ActivityType =
  | 'project_created'
  | 'project_completed'
  | 'project_deleted'
  | 'task_created'
  | 'task_completed'
  | 'task_updated'
  | 'task_deleted'
  | 'study_session_logged'
  | 'subject_created'
  | 'goal_created'
  | 'goal_completed'
  | 'goal_deleted';

export function createActivityService(db: Db) {
  const insertStmt = db.prepare(
    `INSERT INTO activities (type, title, description, entity_type, entity_id)
     VALUES (?, ?, ?, ?, ?)`,
  );

  return {
    record(
      type: ActivityType,
      title: string,
      description = '',
      entityType: string | null = null,
      entityId: number | null = null,
    ): void {
      insertStmt.run(type, title, description, entityType, entityId);
    },

    recent(limit = 10): Activity[] {
      const rows = db
        .prepare(`SELECT * FROM activities ORDER BY id DESC LIMIT ?`)
        .all(limit) as ActivityRow[];

      return rows.map(toActivity);
    },

    removeForEntity(entityType: string, entityId: number): void {
      db.prepare(`DELETE FROM activities WHERE entity_type = ? AND entity_id = ?`).run(
        entityType,
        entityId,
      );
    },
  };
}
