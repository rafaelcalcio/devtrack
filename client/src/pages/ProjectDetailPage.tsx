import { ArrowLeft, CheckCircle2, FolderKanban, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ProjectForm } from '../components/forms/ProjectForm';
import { TaskForm } from '../components/forms/TaskForm';
import {
  toProjectInput,
  toTaskInput,
  type ProjectFormValues,
  type TaskFormValues,
} from '../utils/formValues';
import { Badge, type BadgeTone } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { ProgressBar } from '../components/ui/ProgressBar';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States';
import { useAsync, getErrorMessage } from '../hooks/useAsync';
import { useToast } from '../hooks/useToast';
import { projectsApi, tasksApi } from '../services';
import {
  PRIORITY_LABELS,
  PROJECT_STATUS_LABELS,
  TASK_STATUS_LABELS,
  type Priority,
  type ProjectStatus,
  type TaskStatus,
} from '../types';
import { formatDate } from '../utils/format';
import { dueDateLabel } from '../utils/dates';

const STATUS_TONES: Record<ProjectStatus, BadgeTone> = {
  planning: 'info',
  active: 'success',
  paused: 'warning',
  completed: 'primary',
  archived: 'neutral',
};

const PRIORITY_TONES: Record<Priority, BadgeTone> = {
  low: 'neutral',
  medium: 'info',
  high: 'warning',
  urgent: 'danger',
};

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const projectId = Number(id);
  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { data: project, loading, error, reload } = useAsync(
    () => projectsApi.get(projectId),
    [projectId],
  );

  const { data: tasks, reload: reloadTasks } = useAsync(
    () => tasksApi.list({ projectId }),
    [projectId],
  );

  if (Number.isNaN(projectId)) {
    return <ErrorState message="Identificador de projeto inválido." />;
  }

  if (loading && !project) {
    return <LoadingState message="Carregando projeto..." />;
  }

  if (error && !project) {
    return <ErrorState message={error} onRetry={reload} />;
  }

  if (!project) {
    return <ErrorState message="Projeto não encontrado." />;
  }

  const handleProjectSubmit = async (values: ProjectFormValues) => {
    setSubmitting(true);

    try {
      await projectsApi.update(project.id, toProjectInput(values));
      showToast('Projeto atualizado com sucesso.');
      setProjectFormOpen(false);
      reload();
    } catch (submitError) {
      showToast(getErrorMessage(submitError), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTaskSubmit = async (values: TaskFormValues) => {
    setSubmitting(true);

    try {
      await tasksApi.create({ ...toTaskInput(values), projectId: project.id });
      showToast('Tarefa criada com sucesso.');
      setTaskFormOpen(false);
      reloadTasks();
      reload();
    } catch (submitError) {
      showToast(getErrorMessage(submitError), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleTask = async (taskId: number, status: TaskStatus) => {
    try {
      await tasksApi.changeStatus(taskId, status === 'done' ? 'todo' : 'done');
      reloadTasks();
      reload();
    } catch (toggleError) {
      showToast(getErrorMessage(toggleError), 'error');
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);

    try {
      await projectsApi.remove(project.id);
      showToast('Projeto excluído.');
      navigate('/projetos');
    } catch (deleteError) {
      showToast(getErrorMessage(deleteError), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <div className="page__toolbar">
        <Link className="button button--ghost" to="/projetos">
          <ArrowLeft size={16} aria-hidden="true" />
          Projetos
        </Link>
        <div className="spacer" />
        <Button variant="secondary" onClick={() => setTaskFormOpen(true)} icon={<Plus size={16} aria-hidden="true" />}>
          Nova tarefa
        </Button>
        <Button variant="secondary" onClick={() => setProjectFormOpen(true)} icon={<Pencil size={16} aria-hidden="true" />}>
          Editar projeto
        </Button>
        <Button variant="ghost" onClick={() => setDeleting(true)} icon={<Trash2 size={16} aria-hidden="true" />}>
          Excluir
        </Button>
      </div>

      <div className="detail-grid">
        <div className="page">
          <Card>
            <CardHeader
              title={project.name}
              description={project.description || 'Sem descrição cadastrada.'}
            />
            <CardBody>
              <div className="project-card__badges" style={{ marginBottom: 16 }}>
                <Badge tone={STATUS_TONES[project.status]} dot>
                  {PROJECT_STATUS_LABELS[project.status]}
                </Badge>
                <Badge tone={PRIORITY_TONES[project.priority]}>
                  {PRIORITY_LABELS[project.priority]}
                </Badge>
                <Badge>{project.category}</Badge>
              </div>

              <ProgressBar
                value={project.progress}
                label={`${project.completedTasks} de ${project.totalTasks} tarefas concluídas`}
                color={project.color}
              />

              {project.description ? (
                <p className="description-block" style={{ marginTop: 16 }}>
                  {project.description}
                </p>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Tarefas do projeto" description="Pendências vinculadas a este projeto" />
            <CardBody>
              {(tasks ?? []).length === 0 ? (
                <EmptyState
                  icon={<FolderKanban size={22} aria-hidden="true" />}
                  title="Nenhuma tarefa neste projeto"
                  description="Crie a primeira tarefa para começar a planejar o trabalho."
                />
              ) : (
                <div className="task-list">
                  {(tasks ?? []).map((task) => (
                    <article className="task-item" key={task.id}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void handleToggleTask(task.id, task.status)}
                        aria-label={
                          task.status === 'done' ? `Reabrir ${task.title}` : `Concluir ${task.title}`
                        }
                        icon={
                          task.status === 'done' ? (
                            <CheckCircle2 size={16} aria-hidden="true" />
                          ) : (
                            <span
                              style={{
                                width: 14,
                                height: 14,
                                borderRadius: 4,
                                border: '1.5px solid var(--border-strong)',
                                display: 'inline-block',
                              }}
                              aria-hidden="true"
                            />
                          )
                        }
                      />
                      <div className="task-item__main">
                        <div
                          className={`task-item__title${task.status === 'done' ? ' task-item__title--done' : ''}`}
                        >
                          {task.title}
                        </div>
                        <div className="task-item__meta">
                          <Badge tone={PRIORITY_TONES[task.priority]}>
                            {PRIORITY_LABELS[task.priority]}
                          </Badge>
                          <span>{TASK_STATUS_LABELS[task.status]}</span>
                          {task.dueDate ? (
                            <span className={task.overdue ? 'text-danger' : undefined}>
                              {dueDateLabel(task.dueDate)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader title="Informações" description="Dados cadastrados do projeto" />
          <CardBody>
            <dl className="info-list">
              <div className="info-list__item">
                <dt>Categoria</dt>
                <dd>{project.category}</dd>
              </div>
              <div className="info-list__item">
                <dt>Início</dt>
                <dd>{formatDate(project.startDate)}</dd>
              </div>
              <div className="info-list__item">
                <dt>Prazo</dt>
                <dd>{formatDate(project.dueDate)}</dd>
              </div>
              <div className="info-list__item">
                <dt>Tarefas</dt>
                <dd>{project.totalTasks}</dd>
              </div>
              <div className="info-list__item">
                <dt>Atrasadas</dt>
                <dd>{project.overdueTasks}</dd>
              </div>
              <div className="info-list__item">
                <dt>Progresso</dt>
                <dd>{project.progress}%</dd>
              </div>
            </dl>
          </CardBody>
        </Card>
      </div>

      <ProjectForm
        key={projectFormOpen ? 'aberto' : 'fechado'}
        open={projectFormOpen}
        title="Editar projeto"
        initialValues={{
          name: project.name,
          description: project.description,
          category: project.category,
          status: project.status,
          priority: project.priority,
          color: project.color,
          startDate: project.startDate ?? '',
          dueDate: project.dueDate ?? '',
        }}
        submitLabel="Salvar alterações"
        submitting={submitting}
        onSubmit={handleProjectSubmit}
        onCancel={() => setProjectFormOpen(false)}
      />

      <TaskForm
        key={taskFormOpen ? 'aberta' : 'fechada'}
        open={taskFormOpen}
        title="Nova tarefa"
        initialValues={{ projectId: String(project.id) }}
        submitLabel="Criar tarefa"
        submitting={submitting}
        onSubmit={handleTaskSubmit}
        onCancel={() => setTaskFormOpen(false)}
      />

      <ConfirmDialog
        open={deleting}
        title="Excluir projeto"
        description={`O projeto "${project.name}" e todas as tarefas vinculadas serão removidos. Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir projeto"
        onConfirm={handleDelete}
        onCancel={() => setDeleting(false)}
      />
    </div>
  );
}
