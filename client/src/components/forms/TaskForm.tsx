import { useState, type FormEvent } from 'react';
import { useAsync } from '../../hooks/useAsync';
import { projectsApi } from '../../services';
import type { TaskFormValues } from '../../utils/formValues';
import {
  PRIORITIES,
  PRIORITY_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type Priority,
  type TaskStatus,
} from '../../types';
import { Button } from '../ui/Button';
import { SelectInput, TextArea, TextInput } from '../ui/Form';
import { Modal } from '../ui/Modal';

export interface TaskFormProps {
  open: boolean;
  title: string;
  initialValues?: Partial<TaskFormValues>;
  submitLabel?: string;
  submitting?: boolean;
  onSubmit: (values: TaskFormValues) => void | Promise<void>;
  onCancel: () => void;
}

const DEFAULT_VALUES: TaskFormValues = {
  title: '',
  description: '',
  projectId: '',
  status: 'todo',
  priority: 'medium',
  category: 'Geral',
  dueDate: '',
};

export function TaskForm({
  open,
  title,
  initialValues,
  submitLabel = 'Salvar tarefa',
  submitting = false,
  onSubmit,
  onCancel,
}: TaskFormProps) {
  const [values, setValues] = useState<TaskFormValues>({ ...DEFAULT_VALUES, ...initialValues });
  const [error, setError] = useState<string | null>(null);
  const { data: projects } = useAsync(() => projectsApi.list(), []);

  const update = <K extends keyof TaskFormValues>(key: K, value: TaskFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (values.title.trim().length === 0) {
      setError('Informe o título da tarefa.');
      return;
    }

    setError(null);
    await onSubmit(values);
  };

  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" form="task-form" loading={submitting}>
            {submitLabel}
          </Button>
        </>
      }
    >
      <form id="task-form" className="form" onSubmit={handleSubmit} noValidate>
        {error ? (
          <div className="inline-alert" role="alert">
            {error}
          </div>
        ) : null}

        <TextInput
          label="Título"
          required
          value={values.title}
          placeholder="Ex.: Implementar tela de login"
          onChange={(event) => update('title', event.target.value)}
        />

        <TextArea
          label="Descrição"
          value={values.description}
          placeholder="Detalhes, links e critérios de aceite"
          onChange={(event) => update('description', event.target.value)}
        />

        <div className="form-grid">
          <SelectInput
            label="Projeto"
            value={values.projectId}
            placeholder="Sem projeto"
            options={(projects ?? []).map((project) => ({
              value: String(project.id),
              label: project.name,
            }))}
            onChange={(event) => update('projectId', event.target.value)}
          />

          <SelectInput
            label="Status"
            value={values.status}
            options={TASK_STATUSES.map((status) => ({
              value: status,
              label: TASK_STATUS_LABELS[status],
            }))}
            onChange={(event) => update('status', event.target.value as TaskStatus)}
          />

          <SelectInput
            label="Prioridade"
            value={values.priority}
            options={PRIORITIES.map((priority) => ({
              value: priority,
              label: PRIORITY_LABELS[priority],
            }))}
            onChange={(event) => update('priority', event.target.value as Priority)}
          />

          <TextInput
            label="Categoria"
            value={values.category}
            placeholder="Ex.: Frontend, QA"
            onChange={(event) => update('category', event.target.value)}
          />

          <TextInput
            label="Prazo"
            type="date"
            value={values.dueDate}
            onChange={(event) => update('dueDate', event.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}
