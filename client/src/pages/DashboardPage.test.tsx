import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider } from '../context/ThemeProvider';
import { DashboardPage } from './DashboardPage';

const summary = {
  totals: {
    projects: 3,
    activeProjects: 2,
    tasks: 7,
    pendingTasks: 4,
    completedTasks: 3,
    overdueTasks: 1,
    studyMinutes: 150,
    activeGoals: 2,
  },
  overallProgress: 42,
  tasksByStatus: [
    { status: 'todo', count: 3 },
    { status: 'in_progress', count: 1 },
    { status: 'done', count: 3 },
  ],
  tasksByPriority: [{ priority: 'high', count: 2 }],
  projectsProgress: [
    { id: 1, name: 'Portal', color: '#6366f1', progress: 60, totalTasks: 5, completedTasks: 3 },
  ],
  recentActivities: [
    {
      id: 1,
      type: 'task_completed',
      title: 'Tarefa "Configurar CI" concluída',
      description: '',
      entityType: 'task',
      entityId: 1,
      createdAt: '2026-04-10 10:00:00',
    },
  ],
  upcomingGoals: [
    {
      id: 1,
      title: 'Entregar a API',
      description: '',
      scope: 'professional',
      progress: 70,
      status: 'active',
      dueDate: '2026-04-20',
      completedAt: null,
      createdAt: '2026-04-01 10:00:00',
      updatedAt: '2026-04-01 10:00:00',
    },
  ],
  tasksDueSoon: [],
  productivity: [
    { date: '2026-04-14', completed: 2 },
    { date: '2026-04-15', completed: 0 },
  ],
  studyByDay: [{ date: '2026-04-14', minutes: 60 }],
};

function renderDashboard() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <DashboardPage />
      </ThemeProvider>
    </MemoryRouter>,
  );
}

describe('DashboardPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mostra os totais reais vindos da API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(summary), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );

    renderDashboard();

    expect(await screen.findByText('Tarefas pendentes')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('Tarefas atrasadas')).toBeInTheDocument();
    expect(screen.getByText('Entregar a API')).toBeInTheDocument();
    expect(screen.getByText('42%')).toBeInTheDocument();
  });

  it('exibe mensagem de erro quando a API falha', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: { message: 'Erro interno do servidor.' } }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );

    renderDashboard();

    expect(await screen.findByText('Não foi possível carregar')).toBeInTheDocument();
    expect(screen.getByText('Erro interno do servidor.')).toBeInTheDocument();
  });
});
