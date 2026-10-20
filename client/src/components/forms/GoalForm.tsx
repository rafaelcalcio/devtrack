import { useState, type FormEvent } from 'react';
import type { GoalFormValues } from '../../utils/formValues';
import {
  GOAL_SCOPES,
  GOAL_SCOPE_LABELS,
  GOAL_STATUSES,
  GOAL_STATUS_LABELS,
  type GoalScope,
  type GoalStatus,
} from '../../types';
import { Button } from '../ui/Button';
import { SelectInput, TextArea, TextInput } from '../ui/Form';
import { Modal } from '../ui/Modal';

export interface GoalFormProps {
  open: boolean;
  title: string;
  initialValues?: Partial<GoalFormValues>;
  submitLabel?: string;
  submitting?: boolean;
  onSubmit: (values: GoalFormValues) => void | Promise<void>;
  onCancel: () => void;
}

const DEFAULT_VALUES: GoalFormValues = {
  title: '',
  description: '',
  scope: 'personal',
  progress: '0',
  status: 'active',
  dueDate: '',
};

export function GoalForm({
  open,
  title,
  initialValues,
  submitLabel = 'Salvar meta',
  submitting = false,
  onSubmit,
  onCancel,
}: GoalFormProps) {
  const [values, setValues] = useState<GoalFormValues>({ ...DEFAULT_VALUES, ...initialValues });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (values.title.trim().length === 0) {
      setError('Informe o título da meta.');
      return;
    }

    const progress = Number.parseInt(values.progress, 10);

    if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
      setError('O progresso deve estar entre 0 e 100.');
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
          <Button type="submit" form="goal-form" loading={submitting}>
            {submitLabel}
          </Button>
        </>
      }
    >
      <form id="goal-form" className="form" onSubmit={handleSubmit} noValidate>
        {error ? (
          <div className="inline-alert" role="alert">
            {error}
          </div>
        ) : null}

        <TextInput
          label="Título"
          required
          value={values.title}
          placeholder="Ex.: Concluir o módulo de APIs"
          onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))}
        />

        <TextArea
          label="Descrição"
          value={values.description}
          placeholder="Detalhe o resultado esperado"
          onChange={(event) =>
            setValues((current) => ({ ...current, description: event.target.value }))
          }
        />

        <div className="form-grid">
          <SelectInput
            label="Âmbito"
            value={values.scope}
            options={GOAL_SCOPES.map((scope) => ({
              value: scope,
              label: GOAL_SCOPE_LABELS[scope],
            }))}
            onChange={(event) => setValues((current) => ({ ...current, scope: event.target.value as GoalScope }))}
          />

          <SelectInput
            label="Status"
            value={values.status}
            options={GOAL_STATUSES.map((status) => ({
              value: status,
              label: GOAL_STATUS_LABELS[status],
            }))}
            onChange={(event) =>
              setValues((current) => ({ ...current, status: event.target.value as GoalStatus }))
            }
          />

          <TextInput
            label="Progresso (%)"
            type="number"
            min={0}
            max={100}
            value={values.progress}
            onChange={(event) =>
              setValues((current) => ({ ...current, progress: event.target.value }))
            }
          />

          <TextInput
            label="Prazo"
            type="date"
            value={values.dueDate}
            onChange={(event) => setValues((current) => ({ ...current, dueDate: event.target.value }))}
          />
        </div>
      </form>
    </Modal>
  );
}
