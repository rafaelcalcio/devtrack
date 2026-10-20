import { ChevronLeft, ChevronRight, ListTodo, Plus } from 'lucide-react';
import { useMemo, useState, type DragEvent } from 'react';
import { TaskForm } from '../components/forms/TaskForm';
import { toTaskInput, type TaskFormValues } from '../utils/formValues';
import { Badge, type BadgeTone } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States';
import { useAsync, getErrorMessage } from '../hooks/useAsync';
import { useToast } from '../hooks/useToast';
import { tasksApi } from '../services';
import {
  PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  type Priority,
  type Task,
  type TaskStatus,
} from '../types';
import { formatDate } from '../utils/format';

const COLUMNS: TaskStatus[] = ['todo', 'in_progress', 'done'];

const COLUMN_HINTS: Record<TaskStatus, string> = {
  todo: 'Arraste um cartão para iniciar',
  in_progress: 'Tarefas em desenvolvimento',
  done: 'Tarefas finalizadas',
};

const PRIORITY_TONES: Record<Priority, BadgeTone> = {
  low: 'neutral',
  medium: 'info',
  high: 'warning',
  urgent: 'danger',
};

export function KanbanPage() {
  const { showToast } = useToast();
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [overColumn, setOverColumn] = useState<TaskStatus | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const { data, loading, error, reload } = useAsync(() => tasksApi.list(), []);

  const tasks = useMemo(() => data ?? [], [data]);

  const grouped = useMemo(() => {
    const result: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], done: [] };

    for (const task of tasks) {
      result[task.status].push(task);
    }

    return result;
  }, [tasks]);

  const moveTask = async (task: Task, status: TaskStatus) => {
    if (task.status === status) {
      return;
    }

    try {
      await tasksApi.changeStatus(task.id, status);
      showToast(`Tarefa movida para "${TASK_STATUS_LABELS[status]}".`);
      reload();
    } catch (moveError) {
      showToast(getErrorMessage(moveError), 'error');
    }
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>, status: TaskStatus) => {
    event.preventDefault();
    const id = Number(event.dataTransfer.getData('text/plain'));
    setDraggingId(null);
    setOverColumn(null);

    const task = tasks.find((item) => item.id === id);
    if (task) {
      await moveTask(task, status);
    }
  };

  return (
    <div className="page">
      <div className="page__toolbar">
        <p className="text-muted">
          Arraste os cartões entre as colunas ou use os botões de movimento para atualizar o status no
          banco de dados.
        </p>
        <div className="spacer" />
        <Button icon={<Plus size={16} aria-hidden="true" />} onClick={() => setFormOpen(true)}>
          Nova tarefa
        </Button>
      </div>

      {loading && !data ? (
        <LoadingState message="Carregando quadro..." />
      ) : error && !data ? (
        <ErrorState message={error} onRetry={reload} />
      ) : tasks.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ListTodo size={22} aria-hidden="true" />}
            title="Nenhuma tarefa no quadro"
            description="Crie tarefas para organizar o fluxo de trabalho entre as etapas."
          />
        </Card>
      ) : (
        <div className="kanban">
          {COLUMNS.map((status) => (
            <div
              key={status}
              className={`kanban__column${overColumn === status ? ' kanban__column--over' : ''}`}
              onDragOver={(event) => {
                event.preventDefault();
                setOverColumn(status);
              }}
              onDragLeave={() => setOverColumn((current) => (current === status ? null : current))}
              onDrop={(event) => void handleDrop(event, status)}
            >
              <div className="kanban__column-header">
                <span>{TASK_STATUS_LABELS[status]}</span>
                <span className="kanban__count">{grouped[status].length}</span>
              </div>

              <div className="kanban__cards">
                {grouped[status].length === 0 ? (
                  <p className="text-muted" style={{ fontSize: '0.8rem' }}>
                    {COLUMN_HINTS[status]}
                  </p>
                ) : null}

                {grouped[status].map((task) => {
                  const columnIndex = COLUMNS.indexOf(task.status);

                  return (
                    <article
                      key={task.id}
                      className={`kanban-card${draggingId === task.id ? ' kanban-card--dragging' : ''}`}
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.setData('text/plain', String(task.id));
                        event.dataTransfer.effectAllowed = 'move';
                        setDraggingId(task.id);
                      }}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setOverColumn(null);
                      }}
                    >
                      <div className="kanban-card__title">{task.title}</div>

                      <div className="kanban-card__meta">
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
                        <Badge tone={PRIORITY_TONES[task.priority]}>
                          {PRIORITY_LABELS[task.priority]}
                        </Badge>
                        {task.dueDate ? <span>Prazo: {formatDate(task.dueDate)}</span> : null}
                      </div>

                      <div className="kanban-card__meta">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<ChevronLeft size={14} aria-hidden="true" />}
                          disabled={columnIndex === 0}
                          onClick={() => void moveTask(task, COLUMNS[columnIndex - 1] ?? 'todo')}
                          aria-label={`Mover "${task.title}" para a coluna anterior`}
                        >
                          Mover
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<ChevronRight size={14} aria-hidden="true" />}
                          disabled={columnIndex === COLUMNS.length - 1}
                          onClick={() =>
                            void moveTask(task, COLUMNS[columnIndex + 1] ?? 'done')
                          }
                          aria-label={`Mover "${task.title}" para a próxima coluna`}
                        >
                          Mover
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <TaskForm
        key={formOpen ? 'aberto' : 'fechado'}
        open={formOpen}
        title="Nova tarefa"
        submitting={false}
        onSubmit={async (values: TaskFormValues) => {
          await tasksApi.create(toTaskInput(values));
          showToast('Tarefa criada com sucesso.');
          setFormOpen(false);
          reload();
        }}
        onCancel={() => setFormOpen(false)}
      />
    </div>
  );
}
