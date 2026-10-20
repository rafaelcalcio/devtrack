export function classNames(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}

export function formatDate(dateISO: string | null): string {
  if (!dateISO) {
    return '—';
  }

  const date = new Date(`${dateISO.slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatShortDate(dateISO: string | null): string {
  if (!dateISO) {
    return '—';
  }

  const date = new Date(`${dateISO.slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export function formatDateTime(value: string): string {
  const date = new Date(value.includes('T') ? value : value.replace(' ', 'T') + 'Z');

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(value: string): string {
  const date = new Date(value.includes('T') ? value : value.replace(' ', 'T') + 'Z');

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  const diffSeconds = Math.round((Date.now() - date.getTime()) / 1000);
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['week', 604_800],
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ];

  const formatter = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });

  for (const [unit, seconds] of units) {
    if (Math.abs(diffSeconds) >= seconds) {
      return formatter.format(-Math.round(diffSeconds / seconds), unit);
    }
  }

  return 'agora mesmo';
}

export function formatDuration(minutes: number): string {
  if (minutes <= 0) {
    return '0 min';
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (hours === 0) {
    return `${rest} min`;
  }

  if (rest === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${rest}min`;
}

export function formatHours(minutes: number): string {
  return `${(minutes / 60).toFixed(1).replace('.', ',')}h`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}
