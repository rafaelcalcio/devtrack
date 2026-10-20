import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BarChart } from './BarChart';

describe('BarChart', () => {
  it('desenha uma barra por item com o rótulo no eixo', () => {
    const { container } = render(
      <BarChart
        data={[
          { label: 'seg', value: 2 },
          { label: 'ter', value: 5 },
        ]}
      />,
    );

    expect(screen.getByRole('img', { name: 'Gráfico de barras' })).toBeInTheDocument();
    expect(container.querySelectorAll('rect')).toHaveLength(2);
    expect(screen.getByText('seg')).toBeInTheDocument();
    expect(screen.getByText('ter')).toBeInTheDocument();
  });

  it('aplica o formato de valor informado', () => {
    const { container } = render(
      <BarChart
        data={[{ label: 'seg', value: 90 }]}
        formatValue={(value) => `${value} min`}
      />,
    );

    expect(container.querySelector('title')).toHaveTextContent('seg: 90 min');
    expect(screen.getByText('90 min')).toBeInTheDocument();
  });

  it('mostra a mensagem de estado vazio sem dados', () => {
    render(<BarChart data={[]} />);

    expect(screen.getByText('Sem dados suficientes para o gráfico.')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('mantém a altura mínima das barras com valor positivo', () => {
    const { container } = render(<BarChart data={[{ label: 'seg', value: 1 }]} />);

    const bar = container.querySelector('rect');
    expect(Number(bar?.getAttribute('height'))).toBeGreaterThan(0);
  });
});
