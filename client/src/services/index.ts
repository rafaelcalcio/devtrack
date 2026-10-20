import type {
  CalendarMonth,
  DashboardSummary,
  Goal,
  GoalInput,
  GoalScope,
  GoalStatus,
  SessionInput,
  StudySession,
  StudySubject,
  StudySummary,
  SubjectInput,
} from '../types';
import { apiRequest, buildQuery } from './http';

export { ApiError, apiRequest, buildQuery } from './http';
export type { ApiFieldError } from './http';
export { projectsApi } from './projects';
export type { ProjectFilters } from './projects';
export { tasksApi } from './tasks';
export type { TaskFilters } from './tasks';

export interface GoalFilters {
  status?: GoalStatus;
  scope?: GoalScope;
  search?: string;
}

export interface SessionFilters {
  subjectId?: number;
  from?: string;
  to?: string;
}

export const goalsApi = {
  list(filters: GoalFilters = {}): Promise<Goal[]> {
    return apiRequest<Goal[]>(`/goals${buildQuery({ ...filters })}`);
  },

  get(id: number): Promise<Goal> {
    return apiRequest<Goal>(`/goals/${id}`);
  },

  create(input: GoalInput): Promise<Goal> {
    return apiRequest<Goal>('/goals', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  update(id: number, input: Partial<GoalInput>): Promise<Goal> {
    return apiRequest<Goal>(`/goals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  remove(id: number): Promise<void> {
    return apiRequest<void>(`/goals/${id}`, { method: 'DELETE' });
  },
};

export const studyApi = {
  listSubjects(): Promise<StudySubject[]> {
    return apiRequest<StudySubject[]>('/study/subjects');
  },

  getSubject(id: number): Promise<StudySubject> {
    return apiRequest<StudySubject>(`/study/subjects/${id}`);
  },

  createSubject(input: SubjectInput): Promise<StudySubject> {
    return apiRequest<StudySubject>('/study/subjects', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  updateSubject(id: number, input: Partial<SubjectInput>): Promise<StudySubject> {
    return apiRequest<StudySubject>(`/study/subjects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  removeSubject(id: number): Promise<void> {
    return apiRequest<void>(`/study/subjects/${id}`, { method: 'DELETE' });
  },

  listSessions(filters: SessionFilters = {}): Promise<StudySession[]> {
    return apiRequest<StudySession[]>(`/study/sessions${buildQuery({ ...filters })}`);
  },

  getSession(id: number): Promise<StudySession> {
    return apiRequest<StudySession>(`/study/sessions/${id}`);
  },

  createSession(input: SessionInput): Promise<StudySession> {
    return apiRequest<StudySession>('/study/sessions', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  updateSession(id: number, input: Partial<SessionInput>): Promise<StudySession> {
    return apiRequest<StudySession>(`/study/sessions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  removeSession(id: number): Promise<void> {
    return apiRequest<void>(`/study/sessions/${id}`, { method: 'DELETE' });
  },

  summary(filters: SessionFilters = {}): Promise<StudySummary> {
    return apiRequest<StudySummary>(`/study/summary${buildQuery({ ...filters })}`);
  },
};

export const dashboardApi = {
  summary(): Promise<DashboardSummary> {
    return apiRequest<DashboardSummary>('/dashboard');
  },

  calendar(month: string): Promise<CalendarMonth> {
    return apiRequest<CalendarMonth>(`/calendar${buildQuery({ month })}`);
  },
};
