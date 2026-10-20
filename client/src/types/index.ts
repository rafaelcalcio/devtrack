export type ProjectStatus = 'planning' | 'active' | 'paused' | 'completed' | 'archived';
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type GoalStatus = 'active' | 'completed' | 'cancelled';
export type GoalScope = 'personal' | 'professional';

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

export interface DashboardSummary {
  totals: {
    projects: number;
    activeProjects: number;
    tasks: number;
    pendingTasks: number;
    completedTasks: number;
    overdueTasks: number;
    studyMinutes: number;
    activeGoals: number;
  };
  overallProgress: number;
  tasksByStatus: Array<{ status: string; count: number }>;
  tasksByPriority: Array<{ priority: string; count: number }>;
  projectsProgress: Array<{
    id: number;
    name: string;
    color: string;
    progress: number;
    totalTasks: number;
    completedTasks: number;
  }>;
  recentActivities: Activity[];
  upcomingGoals: Goal[];
  tasksDueSoon: Task[];
  productivity: Array<{ date: string; completed: number }>;
  studyByDay: Array<{ date: string; minutes: number }>;
}

export interface CalendarItem {
  id: string;
  type: 'task' | 'project' | 'goal';
  title: string;
  date: string;
  color: string;
  referenceId: number;
}

export interface CalendarMonth {
  month: string;
  items: CalendarItem[];
}

export interface StudySummary {
  totalMinutes: number;
  totalSessions: number;
  averageSessionMinutes: number;
  bySubject: Array<{
    subjectId: number;
    name: string;
    color: string;
    minutes: number;
    sessions: number;
  }>;
  byDay: Array<{ date: string; minutes: number }>;
  subjectsCount: number;
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

export interface TaskInput {
  title: string;
  description?: string;
  projectId?: number | null;
  status?: TaskStatus;
  priority?: Priority;
  category?: string;
  dueDate?: string | null;
}

export interface GoalInput {
  title: string;
  description?: string;
  scope?: GoalScope;
  progress?: number;
  status?: GoalStatus;
  dueDate?: string | null;
}

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

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: 'Planejado',
  active: 'Em andamento',
  paused: 'Pausado',
  completed: 'Concluído',
  archived: 'Arquivado',
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'A fazer',
  in_progress: 'Em andamento',
  done: 'Concluído',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
};

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  active: 'Em andamento',
  completed: 'Concluída',
  cancelled: 'Cancelada',
};

export const GOAL_SCOPE_LABELS: Record<GoalScope, string> = {
  personal: 'Pessoal',
  professional: 'Profissional',
};

export const PROJECT_STATUSES = Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[];
export const TASK_STATUSES = Object.keys(TASK_STATUS_LABELS) as TaskStatus[];
export const PRIORITIES = Object.keys(PRIORITY_LABELS) as Priority[];
export const GOAL_STATUSES = Object.keys(GOAL_STATUS_LABELS) as GoalStatus[];
export const GOAL_SCOPES = Object.keys(GOAL_SCOPE_LABELS) as GoalScope[];
