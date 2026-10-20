export const PROJECT_STATUSES = ['planning', 'active', 'paused', 'completed', 'archived'] as const;
export const TASK_STATUSES = ['todo', 'in_progress', 'done'] as const;
export const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export const GOAL_STATUSES = ['active', 'completed', 'cancelled'] as const;
export const GOAL_SCOPES = ['personal', 'professional'] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export type TaskStatus = (typeof TASK_STATUSES)[number];
export type Priority = (typeof PRIORITIES)[number];
export type GoalStatus = (typeof GOAL_STATUSES)[number];
export type GoalScope = (typeof GOAL_SCOPES)[number];

export interface Project {
  id: number;
  name: string;
  description: string;
  category: string;
  status: ProjectStatus;
  priority: Priority;
  color: string;
  startDate: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectWithStats extends Project {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  progress: number;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  projectId: number | null;
  projectName: string | null;
  projectColor: string | null;
  status: TaskStatus;
  priority: Priority;
  category: string;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  overdue: boolean;
}

export interface StudySubject {
  id: number;
  name: string;
  technology: string;
  color: string;
  createdAt: string;
  totalMinutes: number;
  sessionCount: number;
}

export interface StudySession {
  id: number;
  subjectId: number;
  subjectName: string;
  subjectColor: string;
  studiedOn: string;
  durationMinutes: number;
  notes: string;
  createdAt: string;
}

export interface Goal {
  id: number;
  title: string;
  description: string;
  scope: GoalScope;
  progress: number;
  status: GoalStatus;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: number;
  type: string;
  title: string;
  description: string;
  entityType: string | null;
  entityId: number | null;
  createdAt: string;
}

export interface CountByStatus {
  status: string;
  count: number;
}
