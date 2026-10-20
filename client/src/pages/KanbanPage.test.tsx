import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { doneTaskFixture, taskFixture } from '../test/fixtures';
import { installApiMock, renderWithProviders } from '../test/helpers';
import { KanbanPage } from './KanbanPage';

function baseRoutes() {
  return {
    'GET /api/tasks': [taskFixture, doneTaskFixture],
  };
}

function createDataTransfer() {
  const store = new Map<string, string>();

  return {
    setData: (format: string, value: string) => store.set(format, value),
    getData: (format: string) => store.get(format) ?? '',
    effectAllowed: 'move',
    types: ['text/plain'],
  };
}

describe('KanbanPage', () => {
  it('organiza as tarefas em colunas com a contagem de cada status', async () => {
    installApiMock(baseRoutes());

    renderWithProviders(<KanbanPage />);

    expect(await screen.findByText('Modelar schema de contratos')).toBeInTheDocument();
    expect(screen.getByText('Tela de login com SSO')).toBeInTheDocument();

    expect(screen.getByText('A fazer')).toBeInTheDocument();
    expect(screen.getByText('Em andamento')).toBeInTheDocument();
    expect(screen.getByText('Concluído')).toBeInTheDocument();
  });

  it('move um cartão para a próxima coluna pelos botões', async () => {
    const api = installApiMock({
      ...baseRoutes(),
      'PATCH /api/tasks/10/status': { ...taskFixture, status: 'in_progress' },
    });
    const user = userEvent.setup();

    renderWithProviders(<KanbanPage />);
    await screen.findByText('Modelar schema de contratos');

    await user.click(
      screen.getByRole('button', { name: 'Mover "Modelar schema de contratos" para a próxima coluna' }),
    );

    await waitFor(() => {
      expect(api.lastCall('PATCH', '/api/tasks/10/status')?.body).toEqual({ status: 'in_progress' });
    });
  });

  it('desabilita o botão de mover quando a tarefa está na última coluna', async () => {
    installApiMock(baseRoutes());

    renderWithProviders(<KanbanPage />);
    await screen.findByText('Tela de login com SSO');

    expect(
      screen.getByRole('button', { name: 'Mover "Tela de login com SSO" para a próxima coluna' }),
    ).toBeDisabled();
  });

  it('atualiza o status ao arrastar um cartão entre colunas', async () => {
    const api = installApiMock({
      ...baseRoutes(),
      'PATCH /api/tasks/10/status': { ...taskFixture, status: 'done' },
    });

    renderWithProviders(<KanbanPage />);
    await screen.findByText('Modelar schema de contratos');

    const card = screen.getByText('Modelar schema de contratos').closest('article');
    expect(card).not.toBeNull();

    const dataTransfer = createDataTransfer();
    fireEvent.dragStart(card as HTMLElement, { dataTransfer });
    fireEvent.drop(screen.getByText('Tela de login com SSO').closest('.kanban__column') as HTMLElement, {
      dataTransfer,
    });

    await waitFor(() => {
      expect(api.lastCall('PATCH', '/api/tasks/10/status')?.body).toEqual({ status: 'done' });
    });
  });

  it('cria uma tarefa a partir do quadro', async () => {
    const api = installApiMock({
      ...baseRoutes(),
      'POST /api/tasks': { status: 201, body: taskFixture },
    });
    const user = userEvent.setup();

    renderWithProviders(<KanbanPage />);
    await screen.findByText('Modelar schema de contratos');

    await user.click(screen.getByRole('button', { name: /nova tarefa/i }));
    await user.type(screen.getByLabelText(/^título/i), 'Tarefa do quadro');
    await user.click(screen.getByRole('button', { name: 'Salvar tarefa' }));

    await waitFor(() => {
      expect(api.lastCall('POST', '/api/tasks')?.body).toMatchObject({ title: 'Tarefa do quadro' });
    });
  });

  it('mostra estado vazio quando não existem tarefas', async () => {
    installApiMock({ 'GET /api/tasks': [] });

    renderWithProviders(<KanbanPage />);

    expect(await screen.findByText('Nenhuma tarefa no quadro')).toBeInTheDocument();
  });

  it('avisa quando a movimentação falha', async () => {
    installApiMock({
      ...baseRoutes(),
      'PATCH /api/tasks/10/status': {
        status: 500,
        body: { error: { message: 'Erro interno do servidor.' } },
      },
    });
    const user = userEvent.setup();

    renderWithProviders(<KanbanPage />);
    await screen.findByText('Modelar schema de contratos');

    await user.click(
      screen.getByRole('button', { name: 'Mover "Modelar schema de contratos" para a próxima coluna' }),
    );

    expect(await screen.findByText('Erro interno do servidor.')).toBeInTheDocument();
  });
});
