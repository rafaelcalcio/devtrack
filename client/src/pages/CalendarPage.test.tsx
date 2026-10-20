import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { installApiMock, renderWithProviders } from '../test/helpers';
import { CalendarPage } from './CalendarPage';

const now = new Date();
const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
const day = (value: number) => `${currentMonth}-${String(value).padStart(2, '0')}`;

const items = [
  {
    id: 'task-10',
    type: 'task',
    title: 'Modelar schema de contratos',
    date: day(5),
    color: '#6366f1',
    referenceId: 10,
  },
  {
    id: 'project-due-1',
    type: 'project',
    title: 'Prazo: Portal de Clientes',
    date: day(15),
    color: '#6366f1',
    referenceId: 1,
  },
  {
    id: 'goal-1',
    type: 'goal',
    title: 'Entregar a API',
    date: day(20),
    color: '#f59e0b',
    referenceId: 1,
  },
];

describe('CalendarPage', () => {
  it('renderiza o mês atual e os itens do calendário', async () => {
    installApiMock({ 'GET /api/calendar': { month: currentMonth, items } });

    renderWithProviders(<CalendarPage />);

    expect(await screen.findByText('Modelar schema de contratos')).toBeInTheDocument();
    expect(screen.getByText('Prazo: Portal de Clientes')).toBeInTheDocument();
    expect(screen.getByText('Entregar a API')).toBeInTheDocument();
  });

  it('navega entre os meses', async () => {
    const api = installApiMock({ 'GET /api/calendar': { month: currentMonth, items } });
    const user = userEvent.setup();

    renderWithProviders(<CalendarPage />);
    await screen.findByText('Modelar schema de contratos');

    await user.click(screen.getByRole('button', { name: 'Mês anterior' }));
    await waitFor(() => {
      expect(api.callsTo('GET', '/api/calendar').length).toBe(2);
    });

    await user.click(screen.getByRole('button', { name: 'Hoje' }));
    await waitFor(() => {
      expect(api.callsTo('GET', '/api/calendar').length).toBe(3);
    });

    await user.click(screen.getByRole('button', { name: 'Próximo mês' }));
    await waitFor(() => {
      expect(api.callsTo('GET', '/api/calendar').length).toBe(4);
    });
  });

  it('abre o detalhe do item selecionado', async () => {
    installApiMock({ 'GET /api/calendar': { month: currentMonth, items } });
    const user = userEvent.setup();

    renderWithProviders(<CalendarPage />);
    await screen.findByText('Modelar schema de contratos');

    await user.click(screen.getByText('Modelar schema de contratos'));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Tarefa')).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: 'Ver tarefas' })).toHaveAttribute('href', '/tarefas');
  });

  it('mostra o erro quando a API falha', async () => {
    installApiMock({
      'GET /api/calendar': { status: 500, body: { error: { message: 'Erro interno do servidor.' } } },
    });

    renderWithProviders(<CalendarPage />);

    expect(await screen.findByText('Não foi possível carregar')).toBeInTheDocument();
  });
});
