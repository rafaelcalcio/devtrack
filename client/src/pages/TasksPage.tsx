import { KanbanSquare, ListTodo, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TaskForm } from '../components/forms/TaskForm';
import { toTaskInput, type TaskFormValues } from '../utils/formValues';
import { Badge, type BadgeTone } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardBody } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States';
import { useAsync, getErrorMessage } from '../hooks/useAsync';
import { useDebounced } from '../hooks/useDebounced';
import { useToast } from '../hooks/useToast';
import { projectsApi, tasksApi } from '../services';
import {
  PRIORITIES,
  PRIORITY_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type Priority,
  type Task,
  type TaskStatus,
} from '../types';
import { formatDate } from '../utils/format';
import { dueDateLabel } from '../utils/dates';

const PRIORITY_TONES: Record<Priority, BadgeTone> = {
  low: 'neutral',
  medium: 'info',
  high: 'warning',
  urgent: 'danger',
};

const STATUS_TONES: Record<TaskStatus, BadgeTone> = {
  todo: 'neutral',
  in_progress: 'primary',
  done: 'success',
};

export function TasksPage() {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<TaskStatus | ''>('');
  const [priority, setPriority] = useState<Priority | ''>('');
  const [projectId, setProjectId] = useState('');
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const debouncedSearch = useDebounced(search, 300);

  const { data, loading, error, reload } = useAsync(
    () =>
      tasksApi.list({
        search: debouncedSearch || undefined,
        status: status || undefined,
        priority: priority || undefined,
        projectId: projectId ? Number(projectId) : undefined,
        overdue: onlyOverdue ? true : undefined,
      }),
    [debouncedSearch, status, priority, projectId, onlyOverdue],
  );

  const { data: projects } = useAsync(() => projectsApi.list(), []);

  const tasks = data ?? [];

  const handleSubmit = async (values: TaskFormValues) => {
    setSubmitting(true);

    try {
      if (editing) {
        await tasksApi.update(editing.id, toTaskInput(values));
        showToast('Tarefa atualizada com sucesso.');
      } else {
        await tasksApi.create(toTaskInput(values));
        showToast('Tarefa criada com sucesso.');
      }

      setFormOpen(false);
      reload();
    } catch (submitError) {
      showToast(getErrorMessage(submitError), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (task: Task) => {
    const nextStatus: TaskStatus = task.status === 'done' ? 'todo' : 'done';

    try {
      await tasksApi.changeStatus(task.id, nextStatus);
      showToast(nextStatus === 'done' ? 'Tarefa concluída.' : 'Tarefa reaberta.');
      reload();
    } catch (toggleError) {
      showToast(getErrorMessage(toggleError), 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleting) {
      return;
    }

    setSubmitting(true);

    try {
      await tasksApi.remove(deleting.id);
      showToast('Tarefa excluída.');
      setDeleting(null);
      reload();
    } catch (deleteError) {
      showToast(getErrorMessage(deleteError), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <div className="filter-bar">
        <div className="filter-bar__search">
          <Search size={16} aria-hidden="true" />
          <input
            className="input"
            type="search"
            placeholder="Buscar pelo título"
            aria-label="Buscar tarefas pelo título"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <select
          className="select"
          aria-label="Filtrar por status"
          value={status}
          onChange={(event) => setStatus(event.target.value as TaskStatus | '')}
        >
          <option value="">Todos os status</option>
          {TASK_STATUSES.map((option) => (
            <option key={option} value={option}>
              {TASK_STATUS_LABELS[option]}
            </option>
          ))}
        </select>

        <select
          className="select"
          aria-label="Filtrar por prioridade"
          value={priority}
          onChange={(event) => setPriority(event.target.value as Priority | '')}
        >
          <option value="">Todas as prioridades</option>
          {PRIORITIES.map((option) => (
            <option key={option} value={option}>
              {PRIORITY_LABELS[option]}
            </option>
          ))}
        </select>

        <select
          className="select"
          aria-label="Filtrar por projeto"
          value={projectId}
          onChange={(event) => setProjectId(event.target.value)}
        >
          <option value="">Todos os projetos</option>
          {(projects ?? []).map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>

        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={onlyOverdue}
            onChange={(event) => setOnlyOverdue(event.target.checked)}
          />
          Somente atrasadas
        </label>

        <div className="spacer" />

        <Link className="button button--secondary" to="/quadro">
          <KanbanSquare size={16} aria-hidden="true" />
          Ver quadro
        </Link>

        <Button
          icon={<Plus size={16} aria-hidden="true" />}
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          Nova tarefa
        </Button>
      </div>

      {loading && !data ? (
        <LoadingState message="Carregando tarefas..." />
      ) : error && !data ? (
        <ErrorState message={error} onRetry={reload} />
      ) : tasks.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ListTodo size={22} aria-hidden="true" />}
            title="Nenhuma tarefa encontrada"
            description={
              search || status || priority || projectId || onlyOverdue
                ? 'Nenhuma tarefa corresponde aos filtros aplicados.'
                : 'Crie sua primeira tarefa para começar a organizar o trabalho.'
            }
          />
        </Card>
      ) : (
        <Card>
          <CardBody flush>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Tarefa</th>
                    <th scope="col">Projeto</th>
                    <th scope="col">Status</th>
                    <th scope="col">Prioridade</th>
                    <th scope="col">Prazo</th>
                    <th scope="col">
                      <span className="visually-hidden">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id}>
                      <td>
                        <div className="row-title">{task.title}</div>
                        {task.description ? <div className="row-subtitle">{task.description}</div> : null}
                      </td>
                      <td>
                        {task.projectName ? (
                          <span className="task-item__project">
                            <span
                              className="task-item__project-dot"
                              style={{ backgroundColor: task.projectColor ?? 'var(--primary)' }}
                              aria-hidden="true"
                            />
                            {task.projectName}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td>
                        <Badge tone={STATUS_TONES[task.status]} dot>
                          {TASK_STATUS_LABELS[task.status]}
                        </Badge>
                      </td>
                      <td>
                        <Badge tone={PRIORITY_TONES[task.priority]}>{PRIORITY_LABELS[task.priority]}</Badge>
                      </td>
                      <td>
                        <div className={task.overdue ? 'text-danger' : undefined}>
                          {task.dueDate ? formatDate(task.dueDate) : '—'}
                        </div>
                        {task.overdue ? (
                          <div className="row-subtitle text-danger">{dueDateLabel(task.dueDate)}</div>
                        ) : null}
                      </td>
                      <td>
                        <div className="table__actions">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(task)}
                            aria-label={
                              task.status === 'done'
                                ? `Reabrir ${task.title}`
                                : `Concluir ${task.title}`
                            }
                          >
                            {task.status === 'done' ? 'Reabrir' : 'Concluir'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Pencil size={15} aria-hidden="true" />}
                            onClick={() => {
                              setEditing(task);
                              setFormOpen(true);
                            }}
                            aria-label={`Editar ${task.title}`}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Trash2 size={15} aria-hidden="true" />}
                            onClick={() => setDeleting(task)}
                            aria-label={`Excluir ${task.title}`}
                          >
                            Excluir
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      <TaskForm
        key={`${editing?.id ?? 'nova'}-${formOpen ? 'aberto' : 'fechado'}`}
        open={formOpen}
        title={editing ? 'Editar tarefa' : 'Nova tarefa'}
        initialValues={
          editing
            ? {
                title: editing.title,
                description: editing.description,
                projectId: editing.projectId ? String(editing.projectId) : '',
                status: editing.status,
                priority: editing.priority,
                category: editing.category,
                dueDate: editing.dueDate ?? '',
              }
            : undefined
        }
        submitLabel={editing ? 'Salvar alterações' : 'Criar tarefa'}
        submitting={submitting}
        onSubmit={handleSubmit}
        onCancel={() => setFormOpen(false)}
      />

      <ConfirmDialog
        open={deleting !== null}
        title="Excluir tarefa"
        description={`A tarefa "${deleting?.title}" será removida permanentemente.`}
        confirmLabel="Excluir tarefa"
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
