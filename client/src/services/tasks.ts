import type { Priority, Task, TaskInput, TaskStatus } from '../types';
import { apiRequest, buildQuery } from './http';

export interface TaskFilters {
  projectId?: number;
  status?: TaskStatus;
  priority?: Priority;
  category?: string;
  search?: string;
  overdue?: boolean;
}

export const tasksApi = {
  list(filters: TaskFilters = {}): Promise<Task[]> {
    return apiRequest<Task[]>(`/tasks${buildQuery({ ...filters })}`);
  },

  get(id: number): Promise<Task> {
    return apiRequest<Task>(`/tasks/${id}`);
  },

  create(input: TaskInput): Promise<Task> {
    return apiRequest<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  update(id: number, input: Partial<TaskInput>): Promise<Task> {
    return apiRequest<Task>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  changeStatus(id: number, status: TaskStatus): Promise<Task> {
    return apiRequest<Task>(`/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  remove(id: number): Promise<void> {
    return apiRequest<void>(`/tasks/${id}`, { method: 'DELETE' });
  },
};
