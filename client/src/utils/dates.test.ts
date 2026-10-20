import { describe, expect, it } from 'vitest';
import { buildCalendarCells, daysUntil, dueDateLabel, shiftMonth, toISODate } from './dates';

describe('daysUntil', () => {
  it('calcula a diferença em dias para uma data futura', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 3);

    expect(daysUntil(toISODate(tomorrow))).toBe(3);
  });

  it('calcula a diferença em dias para uma data passada', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 2);

    expect(daysUntil(toISODate(yesterday))).toBe(-2);
  });
});

describe('dueDateLabel', () => {
  it('identifica o vencimento de hoje', () => {
    expect(dueDateLabel(toISODate(new Date()))).toBe('Vence hoje');
  });

  it('identifica tarefas sem prazo', () => {
    expect(dueDateLabel(null)).toBe('Sem prazo');
  });
});

describe('shiftMonth', () => {
  it('avança para o próximo mês', () => {
    expect(shiftMonth('2026-01', 1)).toBe('2026-02');
  });

  it('volta para o mês anterior cruzando o ano', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
  });
});

describe('buildCalendarCells', () => {
  it('monta uma grade completa de semanas', () => {
    const cells = buildCalendarCells('2026-04');

    expect(cells.length % 7).toBe(0);
    expect(cells.some((cell) => cell.inMonth && cell.day === 1)).toBe(true);
    expect(cells.some((cell) => cell.inMonth && cell.day === 30)).toBe(true);
  });
});
