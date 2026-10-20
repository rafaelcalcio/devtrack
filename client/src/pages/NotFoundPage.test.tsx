import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../test/helpers';
import { NotFoundPage } from './NotFoundPage';

describe('NotFoundPage', () => {
  it('informa que a página não existe e oferece o retorno ao início', () => {
    renderWithProviders(<NotFoundPage />);

    expect(screen.getByText('Página não encontrada')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar ao início' })).toHaveAttribute('href', '/');
  });

  it('leva ao dashboard pelo botão de ação', async () => {
    const assign = vi.fn();
    const originalLocation = window.location;

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, assign },
    });

    const user = userEvent.setup();
    renderWithProviders(<NotFoundPage />);

    await user.click(screen.getByRole('button', { name: 'Ir para o dashboard' }));

    expect(assign).toHaveBeenCalledWith('/');

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });
});
