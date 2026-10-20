import type {
  Priority,
  ProjectInput,
  ProjectStatus,
  ProjectWithStats,
} from '../types';
import { apiRequest, buildQuery } from './http';

export interface ProjectFilters {
  status?: ProjectStatus;
  priority?: Priority;
  category?: string;
  search?: string;
}

export const projectsApi = {
  list(filters: ProjectFilters = {}): Promise<ProjectWithStats[]> {
    return apiRequest<ProjectWithStats[]>(`/projects${buildQuery({ ...filters })}`);
  },

  get(id: number): Promise<ProjectWithStats> {
    return apiRequest<ProjectWithStats>(`/projects/${id}`);
  },

  create(input: ProjectInput): Promise<ProjectWithStats> {
    return apiRequest<ProjectWithStats>('/projects', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  update(id: number, input: Partial<ProjectInput>): Promise<ProjectWithStats> {
    return apiRequest<ProjectWithStats>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  remove(id: number): Promise<void> {
    return apiRequest<void>(`/projects/${id}`, { method: 'DELETE' });
  },
};
