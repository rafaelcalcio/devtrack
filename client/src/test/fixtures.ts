import type {
  DashboardSummary,
  Goal,
  ProjectWithStats,
  StudySession,
  StudySubject,
  Task,
} from '../types';

export const projectFixture: ProjectWithStats = {
  id: 1,
  name: 'Portal de Clientes',
  description: 'Painel web para clientes',
  category: 'Web',
  status: 'active',
  priority: 'high',
  color: '#6366f1',
  startDate: '2026-01-05',
  dueDate: '2026-03-31',
  createdAt: '2026-01-05 10:00:00',
  updatedAt: '2026-01-05 10:00:00',
  totalTasks: 4,
  completedTasks: 1,
  overdueTasks: 1,
  progress: 25,
};

export const otherProjectFixture: ProjectWithStats = {
  ...projectFixture,
  id: 2,
  name: 'API de Pagamentos',
  status: 'planning',
  priority: 'medium',
  totalTasks: 0,
  completedTasks: 0,
  overdueTasks: 0,
  progress: 0,
};

export const taskFixture: Task = {
  id: 10,
  title: 'Modelar schema de contratos',
  description: 'Definir tabelas',
  projectId: 1,
  projectName: 'Portal de Clientes',
  projectColor: '#6366f1',
  status: 'todo',
  priority: 'urgent',
  category: 'Backend',
  dueDate: '2026-02-10',
  completedAt: null,
  createdAt: '2026-01-05 10:00:00',
  updatedAt: '2026-01-05 10:00:00',
  overdue: false,
};

export const doneTaskFixture: Task = {
  ...taskFixture,
  id: 11,
  title: 'Tela de login com SSO',
  status: 'done',
  priority: 'medium',
  completedAt: '2026-01-20 18:00:00',
  overdue: false,
};

export const overdueTaskFixture: Task = {
  ...taskFixture,
  id: 12,
  title: 'Job de conciliação diária',
  status: 'in_progress',
  priority: 'high',
  dueDate: '2026-01-01',
  overdue: true,
};

export const goalFixture: Goal = {
  id: 1,
  title: 'Entregar a API de Pagamentos',
  description: 'Concluir conciliação e documentação',
  scope: 'professional',
  progress: 70,
  status: 'active',
  dueDate: '2026-03-20',
  completedAt: null,
  createdAt: '2026-01-01 10:00:00',
  updatedAt: '2026-01-01 10:00:00',
};

export const subjectFixture: StudySubject = {
  id: 1,
  name: 'TypeScript',
  technology: 'TypeScript 6',
  color: '#3178c6',
  createdAt: '2026-01-01 10:00:00',
  totalMinutes: 120,
  sessionCount: 2,
};

export const sessionFixture: StudySession = {
  id: 1,
  subjectId: 1,
  subjectName: 'TypeScript',
  subjectColor: '#3178c6',
  studiedOn: '2026-02-10',
  durationMinutes: 60,
  notes: 'Tipagem avançada',
  createdAt: '2026-02-10 20:00:00',
};

export const dashboardFixture: DashboardSummary = {
  totals: {
    projects: 2,
    activeProjects: 1,
    tasks: 3,
    pendingTasks: 2,
    completedTasks: 1,
    overdueTasks: 1,
    studyMinutes: 120,
    activeGoals: 1,
  },
  overallProgress: 42,
  tasksByStatus: [
    { status: 'todo', count: 1 },
    { status: 'done', count: 1 },
    { status: 'in_progress', count: 1 },
  ],
  tasksByPriority: [{ priority: 'urgent', count: 1 }],
  projectsProgress: [
    {
      id: 1,
      name: 'Portal de Clientes',
      color: '#6366f1',
      progress: 25,
      totalTasks: 4,
      completedTasks: 1,
    },
  ],
  recentActivities: [
    {
      id: 1,
      type: 'task_completed',
      title: 'Tarefa "Tela de login" concluída',
      description: '',
      entityType: 'task',
      entityId: 11,
      createdAt: '2026-02-10 18:00:00',
    },
  ],
  upcomingGoals: [goalFixture],
  tasksDueSoon: [overdueTaskFixture],
  productivity: [
    { date: '2026-02-09', completed: 1 },
    { date: '2026-02-10', completed: 0 },
  ],
  studyByDay: [{ date: '2026-02-10', minutes: 60 }],
};
