import { FolderKanban, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ProjectForm } from '../components/forms/ProjectForm';
import { toProjectInput, type ProjectFormValues } from '../utils/formValues';
import { Badge, type BadgeTone } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { ProgressBar } from '../components/ui/ProgressBar';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States';
import { useAsync, getErrorMessage } from '../hooks/useAsync';
import { useDebounced } from '../hooks/useDebounced';
import { useToast } from '../hooks/useToast';
import { projectsApi } from '../services';
import {
  PRIORITIES,
  PRIORITY_LABELS,
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  type Priority,
  type ProjectStatus,
  type ProjectWithStats,
} from '../types';
import { formatDate } from '../utils/format';

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

export function ProjectsPage() {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ProjectStatus | ''>('');
  const [priority, setPriority] = useState<Priority | ''>('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectWithStats | null>(null);
  const [deleting, setDeleting] = useState<ProjectWithStats | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const debouncedSearch = useDebounced(search, 300);

  const { data, loading, error, reload } = useAsync(
    () =>
      projectsApi.list({
        status: status || undefined,
        priority: priority || undefined,
        search: debouncedSearch || undefined,
      }),
    [status, priority, debouncedSearch],
  );

  const projects = useMemo(() => data ?? [], [data]);

  const openCreateModal = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEditModal = (project: ProjectWithStats) => {
    setEditing(project);
    setFormOpen(true);
  };

  const handleSubmit = async (values: ProjectFormValues) => {
    setSubmitting(true);

    try {
      if (editing) {
        await projectsApi.update(editing.id, toProjectInput(values));
        showToast('Projeto atualizado com sucesso.');
      } else {
        await projectsApi.create(toProjectInput(values));
        showToast('Projeto criado com sucesso.');
      }

      setFormOpen(false);
      reload();
    } catch (submitError) {
      showToast(getErrorMessage(submitError), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) {
      return;
    }

    setSubmitting(true);

    try {
      await projectsApi.remove(deleting.id);
      showToast('Projeto excluído.');
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
            placeholder="Buscar por nome"
            aria-label="Buscar projetos pelo nome"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <select
          className="select"
          aria-label="Filtrar por status"
          value={status}
          onChange={(event) => setStatus(event.target.value as ProjectStatus | '')}
        >
          <option value="">Todos os status</option>
          {PROJECT_STATUSES.map((option) => (
            <option key={option} value={option}>
              {PROJECT_STATUS_LABELS[option]}
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

        <div className="spacer" />

        <Button icon={<Plus size={16} aria-hidden="true" />} onClick={openCreateModal}>
          Novo projeto
        </Button>
      </div>

      {loading && !data ? (
        <LoadingState message="Carregando projetos..." />
      ) : error && !data ? (
        <ErrorState message={error} onRetry={reload} />
      ) : projects.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FolderKanban size={22} aria-hidden="true" />}
            title="Nenhum projeto encontrado"
            description={
              search || status || priority
                ? 'Nenhum projeto corresponde aos filtros aplicados. Tente limpar a busca.'
                : 'Comece criando o seu primeiro projeto para começar a organizar o trabalho.'
            }
            actionLabel={search || status || priority ? undefined : 'Criar projeto'}
            onAction={search || status || priority ? undefined : openCreateModal}
          />
        </Card>
      ) : (
        <div className="project-grid">
          {projects.map((project) => (
            <article className="project-card" key={project.id}>
              <div className="project-card__head">
                <span className="project-card__color" style={{ backgroundColor: project.color }} aria-hidden="true" />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h3 className="project-card__title">{project.name}</h3>
                  <p className="project-card__description">
                    {project.description || 'Sem descrição cadastrada.'}
                  </p>
                </div>
              </div>

              <div className="project-card__badges">
                <Badge tone={STATUS_TONES[project.status]} dot>
                  {PROJECT_STATUS_LABELS[project.status]}
                </Badge>
                <Badge tone={PRIORITY_TONES[project.priority]}>{PRIORITY_LABELS[project.priority]}</Badge>
                {project.category ? <Badge>{project.category}</Badge> : null}
                {project.overdueTasks > 0 ? <Badge tone="danger">{project.overdueTasks} atrasadas</Badge> : null}
              </div>

              <ProgressBar
                value={project.progress}
                label={`${project.completedTasks}/${project.totalTasks} tarefas concluídas`}
                color={project.color}
              />

              <div className="project-card__meta">
                <span>Início: {formatDate(project.startDate)}</span>
                <span>Prazo: {formatDate(project.dueDate)}</span>
              </div>

              <div className="project-card__footer">
                <Link className="button button--ghost button--sm" to={`/projetos/${project.id}`}>
                  Ver detalhes
                </Link>
                <div className="spacer" />
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Pencil size={15} aria-hidden="true" />}
                  onClick={() => openEditModal(project)}
                  aria-label={`Editar ${project.name}`}
                >
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Trash2 size={15} aria-hidden="true" />}
                  onClick={() => setDeleting(project)}
                  aria-label={`Excluir ${project.name}`}
                >
                  Excluir
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <ProjectForm
        key={`${editing?.id ?? 'novo'}-${formOpen ? 'aberto' : 'fechado'}`}
        open={formOpen}
        title={editing ? 'Editar projeto' : 'Novo projeto'}
        initialValues={
          editing
            ? {
                name: editing.name,
                description: editing.description,
                category: editing.category,
                status: editing.status,
                priority: editing.priority,
                color: editing.color,
                startDate: editing.startDate ?? '',
                dueDate: editing.dueDate ?? '',
              }
            : undefined
        }
        submitLabel={editing ? 'Salvar alterações' : 'Criar projeto'}
        submitting={submitting}
        onSubmit={handleSubmit}
        onCancel={() => setFormOpen(false)}
      />

      <ConfirmDialog
        open={deleting !== null}
        title="Excluir projeto"
        description={`O projeto "${deleting?.name}" e todas as tarefas vinculadas serão removidos. Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir projeto"
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
