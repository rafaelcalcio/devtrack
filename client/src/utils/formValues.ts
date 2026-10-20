import type {
  GoalInput,
  GoalScope,
  GoalStatus,
  Priority,
  ProjectInput,
  ProjectStatus,
  SessionInput,
  SubjectInput,
  TaskInput,
  TaskStatus,
} from '../types';

export interface ProjectFormValues {
  name: string;
  description: string;
  category: string;
  status: ProjectStatus;
  priority: Priority;
  color: string;
  startDate: string;
  dueDate: string;
}

export interface TaskFormValues {
  title: string;
  description: string;
  projectId: string;
  status: TaskStatus;
  priority: Priority;
  category: string;
  dueDate: string;
}

export interface GoalFormValues {
  title: string;
  description: string;
  scope: GoalScope;
  progress: string;
  status: GoalStatus;
  dueDate: string;
}

export interface SubjectFormValues {
  name: string;
  technology: string;
  color: string;
}

export interface SessionFormValues {
  subjectId: string;
  studiedOn: string;
  durationMinutes: string;
  notes: string;
}

export function toProjectInput(values: ProjectFormValues): ProjectInput {
  return {
    name: values.name.trim(),
    description: values.description.trim(),
    category: values.category.trim() || 'Geral',
    status: values.status,
    priority: values.priority,
    color: values.color,
    startDate: values.startDate ? values.startDate : null,
    dueDate: values.dueDate ? values.dueDate : null,
  };
}

export function toTaskInput(values: TaskFormValues): TaskInput {
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    projectId: values.projectId ? Number(values.projectId) : null,
    status: values.status,
    priority: values.priority,
    category: values.category.trim() || 'Geral',
    dueDate: values.dueDate ? values.dueDate : null,
  };
}

export function toGoalInput(values: GoalFormValues): GoalInput {
  const progress = Number.parseInt(values.progress, 10);

  return {
    title: values.title.trim(),
    description: values.description.trim(),
    scope: values.scope,
    progress: Number.isFinite(progress) ? Math.min(100, Math.max(0, progress)) : 0,
    status: values.status,
    dueDate: values.dueDate ? values.dueDate : null,
  };
}

export function toSubjectInput(values: SubjectFormValues): SubjectInput {
  return {
    name: values.name.trim(),
    technology: values.technology.trim(),
    color: values.color,
  };
}

export function toSessionInput(values: SessionFormValues): SessionInput {
  return {
    subjectId: Number(values.subjectId),
    studiedOn: values.studiedOn,
    durationMinutes: Number(values.durationMinutes),
    notes: values.notes.trim(),
  };
}
