import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ThemeProvider } from '../../context/ThemeProvider';
import { AppLayout } from './AppLayout';

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <ThemeProvider>
        <AppLayout />
      </ThemeProvider>
    </MemoryRouter>,
  );
}

describe('AppLayout', () => {
  it('exibe os links principais de navegação', () => {
    renderLayout();

    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Projetos' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tarefas' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Quadro' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Estudos' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Metas' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Calendário' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Configurações' })).toBeInTheDocument();
  });

  it('alterna entre os temas claro e escuro', async () => {
    const user = userEvent.setup();
    renderLayout();

    const button = screen.getByRole('button', { name: /tema/i });

    const initialTheme = document.documentElement.dataset.theme;
    await user.click(button);

    expect(document.documentElement.dataset.theme).not.toBe(initialTheme);
  });

  it('informa que a aplicação é de uso local e sem autenticação', () => {
    renderLayout();

    expect(screen.getByText('Versão local')).toBeInTheDocument();
  });
});
