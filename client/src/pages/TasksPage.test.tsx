import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  doneTaskFixture,
  overdueTaskFixture,
  projectFixture,
  taskFixture,
} from '../test/fixtures';
import { installApiMock, renderWithProviders } from '../test/helpers';
import { TasksPage } from './TasksPage';

function baseRoutes() {
  return {
    'GET /api/tasks': [taskFixture, doneTaskFixture, overdueTaskFixture],
    'GET /api/projects': [projectFixture],
  };
}

describe('TasksPage', () => {
  it('lista as tarefas com projeto, status, prioridade e prazo', async () => {
    installApiMock(baseRoutes());

    renderWithProviders(<TasksPage />);

    expect(await screen.findByText('Modelar schema de contratos')).toBeInTheDocument();

    const table = screen.getByRole('table');
    expect(within(table).getAllByText('Portal de Clientes').length).toBe(3);
    expect(within(table).getByText('Urgente')).toBeInTheDocument();
    expect(within(table).getAllByText('10/02/2026').length).toBe(2);
    expect(within(table).getByText(/\d+ dias em atraso/)).toBeInTheDocument();
  });

  it('aplica os filtros de status, prioridade, projeto e atrasadas', async () => {
    const api = installApiMock(baseRoutes());
    const user = userEvent.setup();

    renderWithProviders(<TasksPage />);
    await screen.findByText('Modelar schema de contratos');

    await user.selectOptions(screen.getByLabelText('Filtrar por status'), 'done');
    await waitFor(() => {
      expect(api.lastCall('GET', '/api/tasks')?.query.get('status')).toBe('done');
    });

    await user.selectOptions(screen.getByLabelText('Filtrar por prioridade'), 'urgent');
    await waitFor(() => {
      expect(api.lastCall('GET', '/api/tasks')?.query.get('priority')).toBe('urgent');
    });

    await user.selectOptions(screen.getByLabelText('Filtrar por projeto'), '1');
    await waitFor(() => {
      expect(api.lastCall('GET', '/api/tasks')?.query.get('projectId')).toBe('1');
    });

    await user.click(screen.getByLabelText('Somente atrasadas'));
    await waitFor(() => {
      expect(api.lastCall('GET', '/api/tasks')?.query.get('overdue')).toBe('true');
    });
  });

  it('busca por título com debounce', async () => {
    const api = installApiMock(baseRoutes());
    const user = userEvent.setup();

    renderWithProviders(<TasksPage />);
    await screen.findByText('Modelar schema de contratos');

    await user.type(screen.getByLabelText('Buscar tarefas pelo título'), 'schema');

    await waitFor(
      () => {
        expect(api.lastCall('GET', '/api/tasks')?.query.get('search')).toBe('schema');
      },
      { timeout: 2000 },
    );
  });

  it('conclui e reabre uma tarefa', async () => {
    const api = installApiMock({
      ...baseRoutes(),
      'PATCH /api/tasks/10/status': taskFixture,
    });
    const user = userEvent.setup();

    renderWithProviders(<TasksPage />);
    await screen.findByText('Modelar schema de contratos');

    await user.click(screen.getByRole('button', { name: 'Concluir Modelar schema de contratos' }));
    await waitFor(() => {
      expect(api.lastCall('PATCH', '/api/tasks/10/status')?.body).toEqual({ status: 'done' });
    });

    await user.click(screen.getByRole('button', { name: 'Reabrir Tela de login com SSO' }));
    await waitFor(() => {
      expect(api.lastCall('PATCH', '/api/tasks/11/status')?.body).toEqual({ status: 'todo' });
    });
  });

  it('cria uma tarefa com os dados preenchidos', async () => {
    const api = installApiMock({
      ...baseRoutes(),
      'POST /api/tasks': { status: 201, body: taskFixture },
    });
    const user = userEvent.setup();

    renderWithProviders(<TasksPage />);
    await screen.findByText('Modelar schema de contratos');

    await user.click(screen.getByRole('button', { name: /nova tarefa/i }));
    await user.type(screen.getByLabelText(/^título/i), 'Tarefa nova');
    await user.selectOptions(screen.getByLabelText('Status'), 'in_progress');
    await user.click(screen.getByRole('button', { name: 'Criar tarefa' }));

    await waitFor(() => {
      expect(api.lastCall('POST', '/api/tasks')?.body).toMatchObject({
        title: 'Tarefa nova',
        status: 'in_progress',
      });
    });

    expect(await screen.findByText('Tarefa criada com sucesso.')).toBeInTheDocument();
  });

  it('valida o título obrigatório', async () => {
    const api = installApiMock(baseRoutes());
    const user = userEvent.setup();

    renderWithProviders(<TasksPage />);
    await screen.findByText('Modelar schema de contratos');

    await user.click(screen.getByRole('button', { name: /nova tarefa/i }));
    await user.click(screen.getByRole('button', { name: 'Criar tarefa' }));

    expect(await screen.findByText('Informe o título da tarefa.')).toBeInTheDocument();
    expect(api.callsTo('POST', '/api/tasks')).toHaveLength(0);
  });

  it('edita uma tarefa existente', async () => {
    const api = installApiMock({
      ...baseRoutes(),
      'PATCH /api/tasks/10': taskFixture,
    });
    const user = userEvent.setup();

    renderWithProviders(<TasksPage />);
    await screen.findByText('Modelar schema de contratos');

    await user.click(screen.getByRole('button', { name: 'Editar Modelar schema de contratos' }));

    const titleInput = screen.getByLabelText(/^título/i) as HTMLInputElement;
    expect(titleInput.value).toBe('Modelar schema de contratos');

    await user.clear(titleInput);
    await user.type(titleInput, 'Título revisado');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() => {
      expect(api.lastCall('PATCH', '/api/tasks/10')?.body).toMatchObject({ title: 'Título revisado' });
    });
  });

  it('exclui uma tarefa após confirmação', async () => {
    const api = installApiMock({
      ...baseRoutes(),
      'DELETE /api/tasks/10': { status: 204, body: null },
    });
    const user = userEvent.setup();

    renderWithProviders(<TasksPage />);
    await screen.findByText('Modelar schema de contratos');

    await user.click(screen.getByRole('button', { name: 'Excluir Modelar schema de contratos' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Excluir tarefa' }));

    await waitFor(() => {
      expect(api.callsTo('DELETE', '/api/tasks/10')).toHaveLength(1);
    });
  });

  it('mostra estado vazio quando não há tarefas', async () => {
    installApiMock({ 'GET /api/tasks': [], 'GET /api/projects': [] });

    renderWithProviders(<TasksPage />);

    expect(await screen.findByText('Nenhuma tarefa encontrada')).toBeInTheDocument();
  });

  it('oferece o atalho para o quadro Kanban', async () => {
    installApiMock(baseRoutes());

    renderWithProviders(<TasksPage />);
    await screen.findByText('Modelar schema de contratos');

    expect(screen.getByRole('link', { name: /ver quadro/i })).toHaveAttribute('href', '/quadro');
  });
});
