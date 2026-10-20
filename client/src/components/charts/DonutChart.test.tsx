import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DonutChart } from './DonutChart';

describe('DonutChart', () => {
  it('desenha um segmento por item e monta a legenda', () => {
    const { container } = render(
      <DonutChart
        data={[
          { label: 'A fazer', value: 3, color: '#6366f1' },
          { label: 'Concluído', value: 1, color: '#10b981' },
        ]}
        centerLabel="total"
        centerValue="4"
      />,
    );

    expect(screen.getByRole('img', { name: 'Gráfico de rosca' })).toBeInTheDocument();
    expect(container.querySelectorAll('circle')).toHaveLength(3);
    expect(screen.getByText('A fazer')).toBeInTheDocument();
    expect(screen.getByText('Concluído')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('total')).toBeInTheDocument();
  });

  it('usa a cor de cada item no segmento correspondente', () => {
    const { container } = render(
      <DonutChart
        data={[
          { label: 'A fazer', value: 2, color: '#123456' },
          { label: 'Concluído', value: 2, color: '#654321' },
        ]}
      />,
    );

    const segments = container.querySelectorAll('g circle');
    expect(segments[1]).toHaveAttribute('stroke', '#123456');
    expect(segments[2]).toHaveAttribute('stroke', '#654321');
  });

  it('mostra a mensagem de estado vazio quando não há valores', () => {
    render(<DonutChart data={[{ label: 'A fazer', value: 0, color: '#6366f1' }]} />);

    expect(screen.getByText('Sem dados para exibir.')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('aceita uma mensagem de estado vazio personalizada', () => {
    render(<DonutChart data={[]} emptyMessage="Nenhuma tarefa por status." />);

    expect(screen.getByText('Nenhuma tarefa por status.')).toBeInTheDocument();
  });
});
