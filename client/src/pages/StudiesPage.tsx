import { BookOpen, Clock, Pencil, Plus, Timer, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  SessionForm,
  SubjectForm,
} from '../components/forms/StudyForms';
import {
  toSessionInput,
  toSubjectInput,
  type SessionFormValues,
  type SubjectFormValues,
} from '../utils/formValues';
import { BarChart } from '../components/charts/BarChart';
import { Button } from '../components/ui/Button';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States';
import { useAsync, getErrorMessage } from '../hooks/useAsync';
import { useToast } from '../hooks/useToast';
import { studyApi } from '../services';
import type { StudySession, StudySubject } from '../types';
import { formatDate, formatDuration, formatShortDate } from '../utils/format';

export function StudiesPage() {
  const { showToast } = useToast();
  const [subjectFormOpen, setSubjectFormOpen] = useState(false);
  const [sessionFormOpen, setSessionFormOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<StudySubject | null>(null);
  const [editingSession, setEditingSession] = useState<StudySession | null>(null);
  const [deletingSubject, setDeletingSubject] = useState<StudySubject | null>(null);
  const [deletingSession, setDeletingSession] = useState<StudySession | null>(null);
  const [subjectFilter, setSubjectFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: subjects, loading: subjectsLoading, error: subjectsError, reload: reloadSubjects } =
    useAsync(() => studyApi.listSubjects(), []);

  const { data: sessions, loading: sessionsLoading, reload: reloadSessions } = useAsync(
    () =>
      studyApi.listSessions({
        subjectId: subjectFilter ? Number(subjectFilter) : undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
      }),
    [subjectFilter, fromDate, toDate],
  );

  const { data: summary, reload: reloadSummary } = useAsync(() => studyApi.summary(), []);

  const reloadAll = () => {
    reloadSubjects();
    reloadSessions();
    reloadSummary();
  };

  const filteredSessions = useMemo(() => sessions ?? [], [sessions]);

  const handleSubjectSubmit = async (values: SubjectFormValues) => {
    setSubmitting(true);

    try {
      if (editingSubject) {
        await studyApi.updateSubject(editingSubject.id, toSubjectInput(values));
        showToast('Assunto atualizado com sucesso.');
      } else {
        await studyApi.createSubject(toSubjectInput(values));
        showToast('Assunto cadastrado com sucesso.');
      }

      setSubjectFormOpen(false);
      reloadAll();
    } catch (submitError) {
      showToast(getErrorMessage(submitError), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSessionSubmit = async (values: SessionFormValues) => {
    setSubmitting(true);

    try {
      if (editingSession) {
        await studyApi.updateSession(editingSession.id, toSessionInput(values));
        showToast('Sessão atualizada com sucesso.');
      } else {
        await studyApi.createSession(toSessionInput(values));
        showToast('Sessão de estudo registrada.');
      }

      setSessionFormOpen(false);
      setEditingSession(null);
      reloadAll();
    } catch (submitError) {
      showToast(getErrorMessage(submitError), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubject = async () => {
    if (!deletingSubject) {
      return;
    }

    setSubmitting(true);

    try {
      await studyApi.removeSubject(deletingSubject.id);
      showToast('Assunto removido.');
      setDeletingSubject(null);
      reloadAll();
    } catch (deleteError) {
      showToast(getErrorMessage(deleteError), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!deletingSession) {
      return;
    }

    setSubmitting(true);

    try {
      await studyApi.removeSession(deletingSession.id);
      showToast('Sessão removida.');
      setDeletingSession(null);
      reloadAll();
    } catch (deleteError) {
      showToast(getErrorMessage(deleteError), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const hasChartData = (summary?.byDay ?? []).some((item) => item.minutes > 0);

  return (
    <div className="page">
      <div className="study-summary">
        <article className="stat-card">
          <div className="stat-card__top">
            <span className="stat-card__icon stat-card__icon--success">
              <Clock size={18} aria-hidden="true" />
            </span>
            <span className="stat-card__label">Tempo total estudado</span>
          </div>
          <strong className="stat-card__value">
            {summary ? formatDuration(summary.totalMinutes) : '—'}
          </strong>
          <span className="stat-card__hint">Somatório de todas as sessões</span>
        </article>

        <article className="stat-card">
          <div className="stat-card__top">
            <span className="stat-card__icon">
              <Timer size={18} aria-hidden="true" />
            </span>
            <span className="stat-card__label">Sessões registradas</span>
          </div>
          <strong className="stat-card__value">{summary?.totalSessions ?? 0}</strong>
          <span className="stat-card__hint">
            Média de {summary ? formatDuration(summary.averageSessionMinutes) : '0 min'} por sessão
          </span>
        </article>

        <article className="stat-card">
          <div className="stat-card__top">
            <span className="stat-card__icon stat-card__icon--info">
              <BookOpen size={18} aria-hidden="true" />
            </span>
            <span className="stat-card__label">Assuntos cadastrados</span>
          </div>
          <strong className="stat-card__value">{summary?.subjectsCount ?? 0}</strong>
          <span className="stat-card__hint">Tecnologias e áreas em acompanhamento</span>
        </article>
      </div>

      <Card>
        <CardHeader
          title="Assuntos e tecnologias"
          description="Organize os temas que você estuda"
          actions={
            <>
              <Button
                variant="secondary"
                icon={<Plus size={16} aria-hidden="true" />}
                onClick={() => {
                  setEditingSubject(null);
                  setSubjectFormOpen(true);
                }}
              >
                Novo assunto
              </Button>
                <Button
                  icon={<Plus size={16} aria-hidden="true" />}
                  onClick={() => {
                    setEditingSession(null);
                    setSessionFormOpen(true);
                  }}
                  disabled={(subjects ?? []).length === 0}
                >
                  Registrar sessão
                </Button>
            </>
          }
        />
        <CardBody>
          {subjectsLoading && !subjects ? (
            <LoadingState message="Carregando assuntos..." />
          ) : subjectsError ? (
            <ErrorState message={subjectsError} onRetry={reloadSubjects} />
          ) : (subjects ?? []).length === 0 ? (
            <EmptyState
              icon={<BookOpen size={22} aria-hidden="true" />}
              title="Nenhum assunto cadastrado"
              description="Cadastre um assunto (por exemplo, TypeScript) para começar a registrar sessões de estudo."
            />
          ) : (
            <div className="subject-grid">
              {(subjects ?? []).map((subject) => (
                <article className="subject-card" key={subject.id}>
                  <div className="subject-card__top">
                    <span
                      className="subject-card__dot"
                      style={{ backgroundColor: subject.color }}
                      aria-hidden="true"
                    />
                    <div>
                      <div className="subject-card__name">{subject.name}</div>
                      <div className="subject-card__tech">{subject.technology || 'Sem tecnologia'}</div>
                    </div>
                  </div>

                  <div className="subject-card__stats">
                    <span>{formatDuration(subject.totalMinutes)}</span>
                    <span>
                      {subject.sessionCount} {subject.sessionCount === 1 ? 'sessão' : 'sessões'}
                    </span>
                  </div>

                  <div className="subject-card__actions">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Pencil size={14} aria-hidden="true" />}
                      onClick={() => {
                        setEditingSubject(subject);
                        setSubjectFormOpen(true);
                      }}
                      aria-label={`Editar ${subject.name}`}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 size={14} aria-hidden="true" />}
                      onClick={() => setDeletingSubject(subject)}
                      aria-label={`Excluir ${subject.name}`}
                    >
                      Excluir
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {hasChartData ? (
        <Card>
          <CardHeader title="Minutos estudados por dia" description="Histórico completo de sessões" />
          <CardBody>
            <BarChart
              data={(summary?.byDay ?? []).map((item) => ({
                label: formatShortDate(item.date),
                value: item.minutes,
              }))}
              color="#12855f"
              formatValue={(value) => `${Math.round(value)}min`}
            />
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader
          title="Histórico de sessões"
          description="Consulte por data e assunto"
          actions={
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select
                className="select"
                aria-label="Filtrar sessões por assunto"
                value={subjectFilter}
                onChange={(event) => setSubjectFilter(event.target.value)}
              >
                <option value="">Todos os assuntos</option>
                {(subjects ?? []).map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
              <input
                className="input"
                type="date"
                aria-label="Filtrar sessões a partir de"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
              />
              <input
                className="input"
                type="date"
                aria-label="Filtrar sessões até"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
              />
            </div>
          }
        />
        <CardBody flush>
          {sessionsLoading && !sessions ? (
            <LoadingState message="Carregando sessões..." />
          ) : filteredSessions.length === 0 ? (
            <EmptyState
              icon={<Timer size={22} aria-hidden="true" />}
              title="Nenhuma sessão registrada"
              description="Registre suas sessões de estudo para acompanhar o tempo total e o histórico."
            />
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Data</th>
                    <th scope="col">Assunto</th>
                    <th scope="col">Duração</th>
                    <th scope="col">Anotações</th>
                    <th scope="col">
                      <span className="visually-hidden">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.map((session) => (
                    <tr key={session.id}>
                      <td>{formatDate(session.studiedOn)}</td>
                      <td>
                        <span className="task-item__project">
                          <span
                            className="task-item__project-dot"
                            style={{ backgroundColor: session.subjectColor }}
                            aria-hidden="true"
                          />
                          {session.subjectName}
                        </span>
                      </td>
                        <td>{formatDuration(session.durationMinutes)}</td>
                        <td>{session.notes || '—'}</td>
                        <td>
                          <div className="table__actions">
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Pencil size={15} aria-hidden="true" />}
                              onClick={() => {
                                setEditingSession(session);
                                setSessionFormOpen(true);
                              }}
                              aria-label={`Editar sessão de ${formatDate(session.studiedOn)}`}
                            >
                              Editar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Trash2 size={15} aria-hidden="true" />}
                              onClick={() => setDeletingSession(session)}
                              aria-label="Excluir sessão"
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
          )}
        </CardBody>
      </Card>

      <SubjectForm
        key={`${editingSubject?.id ?? 'novo'}-${subjectFormOpen ? 'aberto' : 'fechado'}`}
        open={subjectFormOpen}
        title={editingSubject ? 'Editar assunto' : 'Novo assunto'}
        initialValues={
          editingSubject
            ? {
                name: editingSubject.name,
                technology: editingSubject.technology,
                color: editingSubject.color,
              }
            : undefined
        }
        submitLabel={editingSubject ? 'Salvar alterações' : 'Cadastrar assunto'}
        submitting={submitting}
        onSubmit={handleSubjectSubmit}
        onCancel={() => setSubjectFormOpen(false)}
      />

      <SessionForm
        key={`${editingSession?.id ?? 'nova'}-${sessionFormOpen ? 'aberta' : 'fechada'}`}
        open={sessionFormOpen}
        title={editingSession ? 'Editar sessão de estudo' : 'Registrar sessão de estudo'}
        subjects={(subjects ?? []).map((subject) => ({ id: subject.id, name: subject.name }))}
        initialValues={
          editingSession
            ? {
                subjectId: String(editingSession.subjectId),
                studiedOn: editingSession.studiedOn,
                durationMinutes: String(editingSession.durationMinutes),
                notes: editingSession.notes,
              }
            : undefined
        }
        submitLabel={editingSession ? 'Salvar alterações' : 'Registrar sessão'}
        submitting={submitting}
        onSubmit={handleSessionSubmit}
        onCancel={() => {
          setSessionFormOpen(false);
          setEditingSession(null);
        }}
      />

      <ConfirmDialog
        open={deletingSubject !== null}
        title="Excluir assunto"
        description={`O assunto "${deletingSubject?.name}" e todas as sessões registradas nele serão removidos.`}
        confirmLabel="Excluir assunto"
        onConfirm={handleDeleteSubject}
        onCancel={() => setDeletingSubject(null)}
      />

      <ConfirmDialog
        open={deletingSession !== null}
        title="Excluir sessão"
        description="A sessão de estudo será removida permanentemente do histórico."
        confirmLabel="Excluir sessão"
        onConfirm={handleDeleteSession}
        onCancel={() => setDeletingSession(null)}
      />
    </div>
  );
}
