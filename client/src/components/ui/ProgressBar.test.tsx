import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProgressBar } from './ProgressBar';

describe('ProgressBar', () => {
  it('mostra o percentual informado', () => {
    render(<ProgressBar value={40} label="Tarefas" />);

    expect(screen.getByText('40%')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '40');
  });

  it('limita valores fora do intervalo entre 0 e 100', () => {
    render(<ProgressBar value={180} label="Tarefas" />);

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });
});
