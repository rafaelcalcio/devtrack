import {
  AlertTriangle,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Clock,
  FolderKanban,
  ListTodo,
  Target,
} from 'lucide-react';
import { BarChart } from '../components/charts/BarChart';
import { DonutChart } from '../components/charts/DonutChart';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States';
import { StatCard } from '../components/ui/StatCard';
import { useAsync } from '../hooks/useAsync';
import { dashboardApi } from '../services';
import { TASK_STATUS_LABELS, type TaskStatus } from '../types';
import { formatDuration, formatRelativeTime, formatShortDate } from '../utils/format';
import { dueDateLabel } from '../utils/dates';

const STATUS_COLORS: Record<string, string> = {
  todo: '#94a3b8',
  in_progress: '#5b5bd6',
  done: '#12855f',
};

const ACTIVITY_ICONS: Record<string, typeof CheckCircle2> = {
  task_completed: CheckCircle2,
  task_created: ListTodo,
  project_created: FolderKanban,
  project_completed: FolderKanban,
  goal_created: Target,
  goal_completed: Target,
  study_session_logged: BookOpen,
  subject_created: BookOpen,
};

export function DashboardPage() {
  const { data, loading, error, reload } = useAsync(() => dashboardApi.summary(), []);

  if (loading && !data) {
    return <LoadingState message="Carregando seu painel..." />;
  }

  if (error && !data) {
    return <ErrorState message={error} onRetry={reload} />;
  }

  if (!data) {
    return <EmptyState title="Sem dados" description="Não foi possível carregar o resumo." />;
  }

  const hasProductivityData = data.productivity.some((item) => item.completed > 0);
  const hasStudyData = data.studyByDay.some((item) => item.minutes > 0);
  const donutData = data.tasksByStatus.map((item) => ({
    label: TASK_STATUS_LABELS[item.status as TaskStatus] ?? item.status,
    value: item.count,
    color: STATUS_COLORS[item.status] ?? '#94a3b8',
  }));

  return (
    <div className="page">
      <div className="stat-grid">
        <StatCard
          label="Projetos"
          value={data.totals.projects}
          hint={`${data.totals.activeProjects} em andamento`}
          icon={<FolderKanban size={18} aria-hidden="true" />}
        />
        <StatCard
          label="Tarefas pendentes"
          value={data.totals.pendingTasks}
          hint={`${data.totals.completedTasks} concluídas`}
          icon={<ListTodo size={18} aria-hidden="true" />}
          tone="info"
        />
        <StatCard
          label="Tarefas atrasadas"
          value={data.totals.overdueTasks}
          hint={data.totals.overdueTasks > 0 ? 'Prazo já vencido' : 'Nenhum atraso'}
          icon={<AlertTriangle size={18} aria-hidden="true" />}
          tone="danger"
        />
        <StatCard
          label="Tempo de estudo"
          value={formatDuration(data.totals.studyMinutes)}
          hint="Total acumulado"
          icon={<Clock size={18} aria-hidden="true" />}
          tone="success"
        />
        <StatCard
          label="Metas ativas"
          value={data.totals.activeGoals}
          hint="Em andamento"
          icon={<Target size={18} aria-hidden="true" />}
          tone="warning"
        />
      </div>

      <div className="dashboard-grid">
        <Card className="span-4">
          <CardHeader title="Tarefas por status" description="Distribuição atual das tarefas" />
          <CardBody>
            {data.totals.tasks === 0 ? (
              <EmptyState
                icon={<ListTodo size={22} aria-hidden="true" />}
                title="Nenhuma tarefa por aqui"
                description="Crie sua primeira tarefa para começar a acompanhar o progresso."
              />
            ) : (
              <DonutChart
                data={donutData}
                centerValue={String(data.totals.tasks)}
                centerLabel="tarefas"
              />
            )}
            <div style={{ marginTop: 18 }}>
              <div className="progress__meta">
                <span>Progresso geral dos projetos</span>
                <span>{data.overallProgress}%</span>
              </div>
              <div
                className="progress__track"
                role="progressbar"
                aria-valuenow={data.overallProgress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Progresso geral dos projetos"
              >
                <div className="progress__bar" style={{ width: `${data.overallProgress}%` }} />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="span-8">
          <CardHeader
            title="Produtividade"
            description="Tarefas concluídas nos últimos 14 dias"
          />
          <CardBody>
            {hasProductivityData ? (
              <BarChart
                data={data.productivity.map((item) => ({
                  label: formatShortDate(item.date),
                  value: item.completed,
                }))}
              />
            ) : (
              <EmptyState
                icon={<CalendarClock size={22} aria-hidden="true" />}
                title="Sem tarefas concluídas recentemente"
                description="Conclua tarefas para visualizar o gráfico de produtividade dos últimos 14 dias."
              />
            )}
          </CardBody>
        </Card>

        <Card className="span-6">
          <CardHeader title="Atividades recentes" description="Últimos registros do sistema" />
          <CardBody>
            {data.recentActivities.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 size={22} aria-hidden="true" />}
                title="Sem atividades ainda"
                description="Crie projetos, tarefas e sessões de estudo para ver o histórico aqui."
              />
            ) : (
              <div className="activity-list">
                {data.recentActivities.map((activity) => {
                  const Icon = ACTIVITY_ICONS[activity.type] ?? CheckCircle2;

                  return (
                    <div className="activity-item" key={activity.id}>
                      <span className="activity-item__icon" aria-hidden="true">
                        <Icon size={16} />
                      </span>
                      <div className="activity-item__body">
                        <div className="activity-item__title">{activity.title}</div>
                        <div className="activity-item__meta">
                          {formatRelativeTime(activity.createdAt)}
                          {activity.description ? ` · ${activity.description}` : ''}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>

        <Card className="span-6">
          <CardHeader title="Metas próximas do prazo" description="Metas ativas ordenadas por vencimento" />
          <CardBody>
            {data.upcomingGoals.length === 0 ? (
              <EmptyState
                icon={<Target size={22} aria-hidden="true" />}
                title="Nenhuma meta com prazo"
                description="Crie metas com data de vencimento para acompanhar o que está chegando."
              />
            ) : (
              <div className="goal-list">
                {data.upcomingGoals.map((goal) => (
                  <article className="goal-item" key={goal.id}>
                    <div className="goal-item__top">
                      <span className="goal-item__title">{goal.title}</span>
                    </div>
                    <div className="goal-item__meta">
                      <span>{goal.progress}% concluído</span>
                      <span>·</span>
                      <span>{goal.dueDate ? dueDateLabel(goal.dueDate) : 'Sem prazo'}</span>
                    </div>
                    <div className="progress__track">
                      <div className="progress__bar" style={{ width: `${goal.progress}%` }} />
                    </div>
                  </article>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card className="span-6">
          <CardHeader title="Tarefas com prazo próximo" description="Pendentes ordenadas por vencimento" />
          <CardBody>
            {data.tasksDueSoon.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 size={22} aria-hidden="true" />}
                title="Nenhuma pendência com prazo"
                description="Todas as tarefas com data de vencimento estão em dia."
              />
            ) : (
              <div className="task-list">
                {data.tasksDueSoon.map((task) => (
                  <article className="task-item" key={task.id}>
                    <div className="task-item__main">
                      <div className="task-item__title">{task.title}</div>
                      <div className="task-item__meta">
                        {task.projectName ? (
                          <span className="task-item__project">
                            <span
                              className="task-item__project-dot"
                              style={{ backgroundColor: task.projectColor ?? 'var(--primary)' }}
                              aria-hidden="true"
                            />
                            {task.projectName}
                          </span>
                        ) : null}
                        <span className={task.overdue ? 'text-danger' : undefined}>
                          {task.dueDate ? dueDateLabel(task.dueDate) : 'Sem prazo'}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card className="span-6">
          <CardHeader title="Progresso por projeto" description="Tarefas concluídas em cada projeto" />
          <CardBody>
            {data.projectsProgress.length === 0 ? (
              <EmptyState
                icon={<FolderKanban size={22} aria-hidden="true" />}
                title="Nenhum projeto cadastrado"
                description="Crie um projeto para acompanhar o progresso das tarefas."
              />
            ) : (
              <div className="goal-list">
                {data.projectsProgress.map((project) => (
                  <article className="goal-item" key={project.id}>
                    <div className="goal-item__top">
                      <span
                        className="task-item__project-dot"
                        style={{ backgroundColor: project.color }}
                        aria-hidden="true"
                      />
                      <span className="goal-item__title">{project.name}</span>
                    </div>
                    <div className="goal-item__meta">
                      <span>
                        {project.completedTasks}/{project.totalTasks} tarefas
                      </span>
                    </div>
                    <div className="progress__track">
                      <div
                        className="progress__bar"
                        style={{ width: `${project.progress}%`, backgroundColor: project.color }}
                      />
                    </div>
                  </article>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {hasStudyData ? (
          <Card className="span-12">
            <CardHeader title="Tempo de estudo" description="Minutos estudados nos últimos 7 dias" />
            <CardBody>
              <BarChart
                data={data.studyByDay.map((item) => ({
                  label: formatShortDate(item.date),
                  value: item.minutes,
                }))}
                color="#12855f"
                formatValue={(value) => `${Math.round(value)}min`}
              />
            </CardBody>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
