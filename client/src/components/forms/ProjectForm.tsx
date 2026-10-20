import { useState, type FormEvent } from 'react';
import type { ProjectFormValues } from '../../utils/formValues';
import { Button } from '../ui/Button';
import { SelectInput, TextArea, TextInput } from '../ui/Form';
import { Modal } from '../ui/Modal';
import {
  PRIORITY_LABELS,
  PRIORITIES,
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  type Priority,
  type ProjectStatus,
} from '../../types';

export interface ProjectFormProps {
  open: boolean;
  title: string;
  initialValues?: Partial<ProjectFormValues>;
  submitLabel?: string;
  submitting?: boolean;
  onSubmit: (values: ProjectFormValues) => void | Promise<void>;
  onCancel: () => void;
}

const DEFAULT_VALUES: ProjectFormValues = {
  name: '',
  description: '',
  category: 'Geral',
  status: 'planning',
  priority: 'medium',
  color: '#6366f1',
  startDate: '',
  dueDate: '',
};

export function ProjectForm({
  open,
  title,
  initialValues,
  submitLabel = 'Salvar projeto',
  submitting = false,
  onSubmit,
  onCancel,
}: ProjectFormProps) {
  const [values, setValues] = useState<ProjectFormValues>({ ...DEFAULT_VALUES, ...initialValues });
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof ProjectFormValues>(key: K, value: ProjectFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (values.name.trim().length === 0) {
      setError('Informe o nome do projeto.');
      return;
    }

    if (values.startDate && values.dueDate && values.dueDate < values.startDate) {
      setError('O prazo não pode ser anterior à data de início.');
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
          <Button type="submit" form="project-form" loading={submitting}>
            {submitLabel}
          </Button>
        </>
      }
    >
      <form id="project-form" className="form" onSubmit={handleSubmit} noValidate>
        {error ? (
          <div className="inline-alert" role="alert">
            {error}
          </div>
        ) : null}

        <TextInput
          label="Nome do projeto"
          required
          value={values.name}
          placeholder="Ex.: Portal de clientes"
          onChange={(event) => update('name', event.target.value)}
        />

        <TextArea
          label="Descrição"
          value={values.description}
          placeholder="Objetivo e escopo do projeto"
          onChange={(event) => update('description', event.target.value)}
        />

        <div className="form-grid">
          <TextInput
            label="Categoria"
            value={values.category}
            placeholder="Ex.: Web, Backend"
            onChange={(event) => update('category', event.target.value)}
          />

          <SelectInput
            label="Status"
            value={values.status}
            options={PROJECT_STATUSES.map((status) => ({
              value: status,
              label: PROJECT_STATUS_LABELS[status],
            }))}
            onChange={(event) => update('status', event.target.value as ProjectStatus)}
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

          <div className="field">
            <span className="field__label">Cor do projeto</span>
            <div className="color-input">
              <input
                type="color"
                value={values.color}
                aria-label="Escolher cor do projeto"
                onChange={(event) => update('color', event.target.value)}
              />
              <input
                className="input"
                value={values.color}
                aria-label="Código hexadecimal da cor"
                onChange={(event) => update('color', event.target.value)}
              />
            </div>
          </div>

          <TextInput
            label="Data de início"
            type="date"
            value={values.startDate}
            onChange={(event) => update('startDate', event.target.value)}
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
