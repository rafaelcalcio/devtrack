export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function daysUntil(dateISO: string): number {
  const target = new Date(`${dateISO}T00:00:00`);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate());

  return Math.round((startOfTarget.getTime() - startOfToday.getTime()) / 86_400_000);
}

export function dueDateLabel(dateISO: string | null): string {
  if (!dateISO) {
    return 'Sem prazo';
  }

  const days = daysUntil(dateISO);

  if (days === 0) {
    return 'Vence hoje';
  }

  if (days === 1) {
    return 'Vence amanhã';
  }

  if (days === -1) {
    return 'Venceu ontem';
  }

  if (days < 0) {
    return `${Math.abs(days)} dias em atraso`;
  }

  return `Faltam ${days} dias`;
}

export function formatMonthTitle(month: string): string {
  const [year, monthNumber] = month.split('-');
  const date = new Date(Number(year), Number(monthNumber) - 1, 1);

  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

export function monthKey(date: Date): string {
  return date.toISOString().slice(0, 7);
}

export function shiftMonth(month: string, offset: number): string {
  const [year, monthNumber] = month.split('-');
  const date = new Date(Number(year), Number(monthNumber) - 1 + offset, 1);

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export interface CalendarCell {
  date: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
}

export function buildCalendarCells(month: string): CalendarCell[] {
  const [year, monthNumber] = month.split('-');
  const firstOfMonth = new Date(Number(year), Number(monthNumber) - 1, 1);
  const startOffset = firstOfMonth.getDay();
  const daysInMonth = new Date(Number(year), Number(monthNumber), 0).getDate();
  const daysInPreviousMonth = new Date(Number(year), Number(monthNumber) - 1, 0).getDate();

  const cells: CalendarCell[] = [];
  const today = todayISO();

  for (let index = startOffset - 1; index >= 0; index -= 1) {
    const date = new Date(Number(year), Number(monthNumber) - 1, daysInPreviousMonth - index);
    cells.push({
      date: toISODate(date),
      day: daysInPreviousMonth - index,
      inMonth: false,
      isToday: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(Number(year), Number(monthNumber) - 1, day);
    const iso = toISODate(date);
    cells.push({ date: iso, day, inMonth: true, isToday: iso === today });
  }

  let nextDay = 1;
  while (cells.length % 7 !== 0) {
    const date = new Date(Number(year), Number(monthNumber), nextDay);
    cells.push({
      date: toISODate(date),
      day: nextDay,
      inMonth: false,
      isToday: false,
    });
    nextDay += 1;
  }

  return cells;
}
