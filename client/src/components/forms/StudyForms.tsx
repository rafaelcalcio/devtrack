import { useState, type FormEvent } from 'react';
import type { SessionFormValues, SubjectFormValues } from '../../utils/formValues';
import { Button } from '../ui/Button';
import { SelectInput, TextArea, TextInput } from '../ui/Form';
import { Modal } from '../ui/Modal';

export interface SubjectFormProps {
  open: boolean;
  title: string;
  initialValues?: Partial<SubjectFormValues>;
  submitLabel?: string;
  submitting?: boolean;
  onSubmit: (values: SubjectFormValues) => void | Promise<void>;
  onCancel: () => void;
}

export function SubjectForm({
  open,
  title,
  initialValues,
  submitLabel = 'Salvar assunto',
  submitting = false,
  onSubmit,
  onCancel,
}: SubjectFormProps) {
  const [values, setValues] = useState<SubjectFormValues>({
    name: '',
    technology: '',
    color: '#6366f1',
    ...initialValues,
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (values.name.trim().length === 0) {
      setError('Informe o nome do assunto.');
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
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="submit" form="subject-form" loading={submitting}>
            {submitLabel}
          </Button>
        </>
      }
    >
      <form id="subject-form" className="form" onSubmit={handleSubmit} noValidate>
        {error ? (
          <div className="inline-alert" role="alert">
            {error}
          </div>
        ) : null}

        <TextInput
          label="Assunto"
          required
          value={values.name}
          placeholder="Ex.: TypeScript"
          onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
        />

        <TextInput
          label="Tecnologia"
          value={values.technology}
          placeholder="Ex.: TypeScript 5.9"
          onChange={(event) =>
            setValues((current) => ({ ...current, technology: event.target.value }))
          }
        />

        <div className="field">
          <span className="field__label">Cor</span>
          <div className="color-input">
            <input
              type="color"
              value={values.color}
              aria-label="Escolher cor do assunto"
              onChange={(event) => setValues((current) => ({ ...current, color: event.target.value }))}
            />
            <input
              className="input"
              value={values.color}
              aria-label="Código hexadecimal da cor"
              onChange={(event) => setValues((current) => ({ ...current, color: event.target.value }))}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}

export interface SessionFormProps {
  open: boolean;
  title: string;
  subjects: Array<{ id: number; name: string }>;
  initialValues?: Partial<SessionFormValues>;
  submitLabel?: string;
  submitting?: boolean;
  onSubmit: (values: SessionFormValues) => void | Promise<void>;
  onCancel: () => void;
}

function todayISO(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function SessionForm({
  open,
  title,
  subjects,
  initialValues,
  submitLabel = 'Registrar sessão',
  submitting = false,
  onSubmit,
  onCancel,
}: SessionFormProps) {
  const [values, setValues] = useState<SessionFormValues>({
    subjectId: subjects[0] ? String(subjects[0].id) : '',
    studiedOn: todayISO(),
    durationMinutes: '60',
    notes: '',
    ...initialValues,
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!values.subjectId) {
      setError('Selecione um assunto de estudo.');
      return;
    }

    const duration = Number(values.durationMinutes);

    if (!Number.isFinite(duration) || duration <= 0) {
      setError('Informe a duração da sessão em minutos.');
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
          <Button type="submit" form="session-form" loading={submitting}>
            {submitLabel}
          </Button>
        </>
      }
    >
      <form id="session-form" className="form" onSubmit={handleSubmit} noValidate>
        {error ? (
          <div className="inline-alert" role="alert">
            {error}
          </div>
        ) : null}

        <SelectInput
          label="Assunto"
          required
          value={values.subjectId}
          placeholder="Selecione um assunto"
          options={subjects.map((subject) => ({ value: String(subject.id), label: subject.name }))}
          onChange={(event) =>
            setValues((current) => ({ ...current, subjectId: event.target.value }))
          }
        />

        <div className="form-grid">
          <TextInput
            label="Data"
            type="date"
            required
            value={values.studiedOn}
            onChange={(event) =>
              setValues((current) => ({ ...current, studiedOn: event.target.value }))
            }
          />

          <TextInput
            label="Duração (minutos)"
            type="number"
            min={1}
            required
            value={values.durationMinutes}
            onChange={(event) =>
              setValues((current) => ({ ...current, durationMinutes: event.target.value }))
            }
          />
        </div>

        <TextArea
          label="Anotações"
          value={values.notes}
          placeholder="O que você estudou nesta sessão?"
          onChange={(event) => setValues((current) => ({ ...current, notes: event.target.value }))}
        />
      </form>
    </Modal>
  );
}
