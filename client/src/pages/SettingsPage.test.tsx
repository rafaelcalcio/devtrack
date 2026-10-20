import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '../test/helpers';
import { SettingsPage } from './SettingsPage';

describe('SettingsPage', () => {
  it('salva o nome de exibição no navegador', async () => {
    const user = userEvent.setup();

    renderWithProviders(<SettingsPage />);

    const input = screen.getByLabelText('Nome de exibição');
    await user.clear(input);
    await user.type(input, 'Ana');
    await user.click(screen.getByRole('button', { name: /salvar preferências/i }));

    expect(await screen.findByText('Preferências salvas neste navegador.')).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem('devtrack:displayName') ?? 'null')).toBe('Ana');
    expect(screen.getByText('Ana')).toBeInTheDocument();
  });

  it('usa o nome padrão quando o campo fica vazio', async () => {
    const user = userEvent.setup();

    renderWithProviders(<SettingsPage />);

    const input = screen.getByLabelText('Nome de exibição');
    await user.clear(input);
    await user.click(screen.getByRole('button', { name: /salvar preferências/i }));

    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem('devtrack:displayName') ?? 'null')).toBe(
        'Desenvolvedor',
      );
    });
  });

  it('alterna entre os temas claro e escuro', async () => {
    const user = userEvent.setup();

    renderWithProviders(<SettingsPage />);

    const lightButton = screen.getByRole('button', { name: /claro/i });
    const darkButton = screen.getByRole('button', { name: /escuro/i });

    expect(lightButton).toHaveAttribute('aria-pressed', 'true');

    await user.click(darkButton);

    await waitFor(() => {
      expect(darkButton).toHaveAttribute('aria-pressed', 'true');
    });
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('altera a densidade da interface', async () => {
    const user = userEvent.setup();

    renderWithProviders(<SettingsPage />);

    const compactButton = screen.getByRole('button', { name: /compacta/i });

    await user.click(compactButton);

    await waitFor(() => {
      expect(document.documentElement.dataset.density).toBe('compact');
    });
    expect(JSON.parse(window.localStorage.getItem('devtrack:density') ?? 'null')).toBe('compact');
  });

  it('mostra as informações do aplicativo', () => {
    renderWithProviders(<SettingsPage />);

    expect(screen.getByText('Versão')).toBeInTheDocument();
    expect(screen.getByText('1.0.0')).toBeInTheDocument();
    expect(screen.getByText('server/data/devtrack.db')).toBeInTheDocument();
    expect(screen.getByText(/não existe autenticação/i)).toBeInTheDocument();
  });
});
