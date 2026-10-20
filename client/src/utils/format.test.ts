import { describe, expect, it } from 'vitest';
import { formatDuration, formatPercent, formatShortDate } from './format';

describe('formatDuration', () => {
  it('formata minutos', () => {
    expect(formatDuration(45)).toBe('45 min');
  });

  it('formata horas exatas', () => {
    expect(formatDuration(120)).toBe('2h');
  });

  it('formata horas e minutos', () => {
    expect(formatDuration(150)).toBe('2h 30min');
  });

  it('formata valores zerados', () => {
    expect(formatDuration(0)).toBe('0 min');
  });
});

describe('formatShortDate', () => {
  it('formata a data no padrão brasileiro', () => {
    expect(formatShortDate('2026-04-15')).toMatch(/15/);
  });

  it('devolve um traço para datas ausentes', () => {
    expect(formatShortDate(null)).toBe('—');
  });
});

describe('formatPercent', () => {
  it('arredonda o percentual', () => {
    expect(formatPercent(33.6)).toBe('34%');
  });
});
