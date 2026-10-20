import { CheckCircle2, Pencil, Plus, Search, Target, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { GoalForm } from '../components/forms/GoalForm';
import { toGoalInput, type GoalFormValues } from '../utils/formValues';
import { Badge, type BadgeTone } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { ProgressBar } from '../components/ui/ProgressBar';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States';
import { useAsync, getErrorMessage } from '../hooks/useAsync';
import { useDebounced } from '../hooks/useDebounced';
import { useToast } from '../hooks/useToast';
import { goalsApi } from '../services';
import {
  GOAL_SCOPES,
  GOAL_SCOPE_LABELS,
  GOAL_STATUSES,
  GOAL_STATUS_LABELS,
  type Goal,
  type GoalScope,
  type GoalStatus,
} from '../types';
import { formatDate } from '../utils/format';
import { dueDateLabel } from '../utils/dates';

const STATUS_TONES: Record<GoalStatus, BadgeTone> = {
  active: 'primary',
  completed: 'success',
  cancelled: 'neutral',
};

export function GoalsPage() {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<GoalStatus | ''>('');
  const [scope, setScope] = useState<GoalScope | ''>('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [deleting, setDeleting] = useState<Goal | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const debouncedSearch = useDebounced(search, 300);

  const { data, loading, error, reload } = useAsync(
    () =>
      goalsApi.list({
        search: debouncedSearch || undefined,
        status: status || undefined,
        scope: scope || undefined,
      }),
    [debouncedSearch, status, scope],
  );

  const goals = data ?? [];

  const handleSubmit = async (values: GoalFormValues) => {
    setSubmitting(true);

    try {
      if (editing) {
        await goalsApi.update(editing.id, toGoalInput(values));
        showToast('Meta atualizada com sucesso.');
      } else {
        await goalsApi.create(toGoalInput(values));
        showToast('Meta criada com sucesso.');
      }

      setFormOpen(false);
      reload();
    } catch (submitError) {
      showToast(getErrorMessage(submitError), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async (goal: Goal) => {
    try {
      await goalsApi.update(goal.id, { status: 'completed' });
      showToast('Meta concluída com sucesso.');
      reload();
    } catch (completeError) {
      showToast(getErrorMessage(completeError), 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleting) {
      return;
    }

    setSubmitting(true);

    try {
      await goalsApi.remove(deleting.id);
      showToast('Meta excluída.');
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
            placeholder="Buscar por título"
            aria-label="Buscar metas pelo título"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <select
          className="select"
          aria-label="Filtrar por status"
          value={status}
          onChange={(event) => setStatus(event.target.value as GoalStatus | '')}
        >
          <option value="">Todos os status</option>
          {GOAL_STATUSES.map((option) => (
            <option key={option} value={option}>
              {GOAL_STATUS_LABELS[option]}
            </option>
          ))}
        </select>

        <select
          className="select"
          aria-label="Filtrar por âmbito"
          value={scope}
          onChange={(event) => setScope(event.target.value as GoalScope | '')}
        >
          <option value="">Todos os âmbitos</option>
          {GOAL_SCOPES.map((option) => (
            <option key={option} value={option}>
              {GOAL_SCOPE_LABELS[option]}
            </option>
          ))}
        </select>

        <div className="spacer" />

        <Button
          icon={<Plus size={16} aria-hidden="true" />}
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          Nova meta
        </Button>
      </div>

      {loading && !data ? (
        <LoadingState message="Carregando metas..." />
      ) : error && !data ? (
        <ErrorState message={error} onRetry={reload} />
      ) : goals.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Target size={22} aria-hidden="true" />}
            title="Nenhuma meta encontrada"
            description={
              search || status || scope
                ? 'Nenhuma meta corresponde aos filtros aplicados.'
                : 'Defina a sua primeira meta pessoal ou profissional para acompanhar o progresso.'
            }
          />
        </Card>
      ) : (
        <div className="goal-grid">
          {goals.map((goal) => (
            <article className="goal-card" key={goal.id}>
              <div className="goal-card__title">{goal.title}</div>
              <p className="goal-card__description">{goal.description || 'Sem descrição.'}</p>

              <div className="project-card__badges">
                <Badge tone={STATUS_TONES[goal.status]} dot>
                  {GOAL_STATUS_LABELS[goal.status]}
                </Badge>
                <Badge tone={goal.scope === 'professional' ? 'info' : 'neutral'}>
                  {GOAL_SCOPE_LABELS[goal.scope]}
                </Badge>
              </div>

              <ProgressBar value={goal.progress} label="Progresso" />

              <div className="goal-card__meta">
                <span>Prazo: {formatDate(goal.dueDate)}</span>
                {goal.status === 'active' && goal.dueDate ? (
                  <span className={dueDateLabel(goal.dueDate).includes('atraso') ? 'text-danger' : undefined}>
                    {dueDateLabel(goal.dueDate)}
                  </span>
                ) : null}
              </div>

              <div className="goal-card__footer">
                {goal.status === 'active' ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<CheckCircle2 size={15} aria-hidden="true" />}
                    onClick={() => void handleComplete(goal)}
                  >
                    Concluir
                  </Button>
                ) : null}
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Pencil size={15} aria-hidden="true" />}
                  onClick={() => {
                    setEditing(goal);
                    setFormOpen(true);
                  }}
                  aria-label={`Editar ${goal.title}`}
                >
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Trash2 size={15} aria-hidden="true" />}
                  onClick={() => setDeleting(goal)}
                  aria-label={`Excluir ${goal.title}`}
                >
                  Excluir
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <GoalForm
        key={`${editing?.id ?? 'nova'}-${formOpen ? 'aberto' : 'fechado'}`}
        open={formOpen}
        title={editing ? 'Editar meta' : 'Nova meta'}
        initialValues={
          editing
            ? {
                title: editing.title,
                description: editing.description,
                scope: editing.scope,
                progress: String(editing.progress),
                status: editing.status,
                dueDate: editing.dueDate ?? '',
              }
            : undefined
        }
        submitLabel={editing ? 'Salvar alterações' : 'Criar meta'}
        submitting={submitting}
        onSubmit={handleSubmit}
        onCancel={() => setFormOpen(false)}
      />

      <ConfirmDialog
        open={deleting !== null}
        title="Excluir meta"
        description={`A meta "${deleting?.title}" será removida permanentemente.`}
        confirmLabel="Excluir meta"
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
