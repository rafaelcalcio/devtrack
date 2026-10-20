import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/States';
import { useAsync } from '../hooks/useAsync';
import { dashboardApi } from '../services';
import type { CalendarItem } from '../types';
import { buildCalendarCells, formatMonthTitle, monthKey, shiftMonth } from '../utils/dates';
import { formatDate } from '../utils/format';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const TYPE_LABELS: Record<CalendarItem['type'], string> = {
  task: 'Tarefa',
  project: 'Projeto',
  goal: 'Meta',
};

export function CalendarPage() {
  const [month, setMonth] = useState(() => monthKey(new Date()));
  const [selected, setSelected] = useState<CalendarItem | null>(null);

  const { data, loading, error, reload } = useAsync(() => dashboardApi.calendar(month), [month]);

  const cells = useMemo(() => buildCalendarCells(month), [month]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();

    for (const item of data?.items ?? []) {
      const list = map.get(item.date) ?? [];
      list.push(item);
      map.set(item.date, list);
    }

    return map;
  }, [data]);

  return (
    <div className="page">
      <div className="page__toolbar">
        <Button variant="secondary" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Mês anterior">
          <ChevronLeft size={16} aria-hidden="true" />
          Anterior
        </Button>

        <div className="spacer" style={{ textAlign: 'center' }}>
          <strong className="calendar__title">{formatMonthTitle(month)}</strong>
        </div>

        <Button variant="secondary" onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Próximo mês">
          Próximo
          <ChevronRight size={16} aria-hidden="true" />
        </Button>

        <Button variant="ghost" onClick={() => setMonth(monthKey(new Date()))}>
          Hoje
        </Button>
      </div>

      {loading && !data ? (
        <LoadingState message="Carregando calendário..." />
      ) : error && !data ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <div className="calendar">
          <div className="calendar__grid">
            {WEEKDAYS.map((weekday) => (
              <div className="calendar__weekday" key={weekday}>
                {weekday}
              </div>
            ))}

            {cells.map((cell) => {
              const events = eventsByDate.get(cell.date) ?? [];

              return (
                <div
                  key={cell.date}
                  className={`calendar__day${cell.inMonth ? '' : ' calendar__day--empty'}${
                    cell.isToday ? ' calendar__day--today' : ''
                  }`}
                >
                  <span className="calendar__day-number">{cell.day}</span>

                  {events.slice(0, 3).map((event) => (
                    <button
                      type="button"
                      key={event.id}
                      className="calendar__event"
                      style={{ borderLeftColor: event.color }}
                      onClick={() => setSelected(event)}
                      title={`${TYPE_LABELS[event.type]}: ${event.title}`}
                    >
                      {event.title}
                    </button>
                  ))}

                  {events.length > 3 ? (
                    <span className="row-subtitle">+{events.length - 3} itens</span>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="calendar__legend">
            <span className="calendar__legend-item">
              <span className="calendar__legend-dot" style={{ backgroundColor: '#5b5bd6' }} aria-hidden="true" />
              Tarefas
            </span>
            <span className="calendar__legend-item">
              <span className="calendar__legend-dot" style={{ backgroundColor: '#10b981' }} aria-hidden="true" />
              Projetos
            </span>
            <span className="calendar__legend-item">
              <span className="calendar__legend-dot" style={{ backgroundColor: '#f59e0b' }} aria-hidden="true" />
              Metas
            </span>
            <span className="calendar__legend-item">A cor do item indica o projeto vinculado.</span>
          </div>
        </div>
      )}

      <Modal
        open={selected !== null}
        title={selected ? TYPE_LABELS[selected.type] : ''}
        onClose={() => setSelected(null)}
        size="sm"
      >
        {selected ? (
          <div className="form">
            <div>
              <h3>{selected.title}</h3>
              <p className="text-muted">Data: {formatDate(selected.date)}</p>
            </div>

            {selected.type === 'project' ? (
              <Link className="button button--secondary" to={`/projetos/${selected.referenceId}`}>
                Abrir projeto
              </Link>
            ) : null}

            {selected.type === 'task' ? (
              <Link className="button button--secondary" to="/tarefas">
                Ver tarefas
              </Link>
            ) : null}

            {selected.type === 'goal' ? (
              <Link className="button button--secondary" to="/metas">
                Ver metas
              </Link>
            ) : null}
          </div>
        ) : (
          <EmptyState icon={<CalendarDays size={22} aria-hidden="true" />} title="Sem item selecionado" description="" />
        )}
      </Modal>
    </div>
  );
}
