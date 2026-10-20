import type {
  Activity,
  Goal,
  GoalScope,
  GoalStatus,
  Priority,
  Project,
  ProjectStatus,
  StudySession,
  StudySubject,
  Task,
  TaskStatus,
} from '../types.js';

export interface ProjectRow {
  id: number;
  name: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  color: string;
  start_date: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectStatsRow extends ProjectRow {
  total_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
}

export interface TaskRow {
  id: number;
  title: string;
  description: string;
  project_id: number | null;
  project_name: string | null;
  project_color: string | null;
  status: string;
  priority: string;
  category: string;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubjectRow {
  id: number;
  name: string;
  technology: string;
  color: string;
  created_at: string;
  total_minutes: number;
  session_count: number;
}

export interface SessionRow {
  id: number;
  subject_id: number;
  subject_name: string;
  subject_color: string;
  studied_on: string;
  duration_minutes: number;
  notes: string;
  created_at: string;
}

export interface GoalRow {
  id: number;
  title: string;
  description: string;
  scope: string;
  progress: number;
  status: string;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityRow {
  id: number;
  type: string;
  title: string;
  description: string;
  entity_type: string | null;
  entity_id: number | null;
  created_at: string;
}

export function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    status: row.status as ProjectStatus,
    priority: row.priority as Priority,
    color: row.color,
    startDate: row.start_date,
    dueDate: row.due_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toTask(row: TaskRow, today: string): Task {
  const overdue =
    row.status !== 'done' && row.due_date !== null && row.due_date < today;

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    projectId: row.project_id,
    projectName: row.project_name,
    projectColor: row.project_color,
    status: row.status as TaskStatus,
    priority: row.priority as Priority,
    category: row.category,
    dueDate: row.due_date,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    overdue,
  };
}

export function toSubject(row: SubjectRow): StudySubject {
  return {
    id: row.id,
    name: row.name,
    technology: row.technology,
    color: row.color,
    createdAt: row.created_at,
    totalMinutes: row.total_minutes,
    sessionCount: row.session_count,
  };
}

export function toSession(row: SessionRow): StudySession {
  return {
    id: row.id,
    subjectId: row.subject_id,
    subjectName: row.subject_name,
    subjectColor: row.subject_color,
    studiedOn: row.studied_on,
    durationMinutes: row.duration_minutes,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export function toGoal(row: GoalRow): Goal {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    scope: row.scope as GoalScope,
    progress: row.progress,
    status: row.status as GoalStatus,
    dueDate: row.due_date,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toActivity(row: ActivityRow): Activity {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    description: row.description,
    entityType: row.entity_type,
    entityId: row.entity_id,
    createdAt: row.created_at,
  };
}
