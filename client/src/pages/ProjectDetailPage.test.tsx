import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { projectFixture, taskFixture } from '../test/fixtures';
import { installApiMock, renderWithRoute } from '../test/helpers';
import { ProjectDetailPage } from './ProjectDetailPage';

function baseRoutes() {
  return {
    'GET /api/projects/1': projectFixture,
    'GET /api/tasks': [taskFixture],
  };
}

function renderDetail(route = '/projetos/1') {
  return renderWithRoute(<ProjectDetailPage />, '/projetos/:id', route);
}

describe('ProjectDetailPage', () => {
  it('mostra os dados do projeto e as tarefas vinculadas', async () => {
    installApiMock(baseRoutes());

    renderDetail();

    expect(await screen.findByText('Portal de Clientes')).toBeInTheDocument();
    expect(screen.getByText('1 de 4 tarefas concluídas')).toBeInTheDocument();
    expect(screen.getByText('Modelar schema de contratos')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('conclui uma tarefa da lista', async () => {
    const api = installApiMock({
      ...baseRoutes(),
      'PATCH /api/tasks/10/status': { ...taskFixture, status: 'done' },
    });
    const user = userEvent.setup();

    renderDetail();
    await screen.findByText('Modelar schema de contratos');

    await user.click(screen.getByRole('button', { name: 'Concluir Modelar schema de contratos' }));

    await waitFor(() => {
      expect(api.lastCall('PATCH', '/api/tasks/10/status')?.body).toEqual({ status: 'done' });
    });
  });

  it('cria uma tarefa já vinculada ao projeto', async () => {
    const api = installApiMock({
      ...baseRoutes(),
      'POST /api/tasks': { status: 201, body: taskFixture },
    });
    const user = userEvent.setup();

    renderDetail();
    await screen.findByText('Modelar schema de contratos');

    await user.click(screen.getByRole('button', { name: /nova tarefa/i }));
    await user.type(screen.getByLabelText(/^título/i), 'Tarefa do projeto');
    await user.click(screen.getByRole('button', { name: 'Criar tarefa' }));

    await waitFor(() => {
      expect(api.lastCall('POST', '/api/tasks')?.body).toMatchObject({
        title: 'Tarefa do projeto',
        projectId: 1,
      });
    });
  });

  it('edita o projeto', async () => {
    const api = installApiMock({
      ...baseRoutes(),
      'PATCH /api/projects/1': projectFixture,
    });
    const user = userEvent.setup();

    renderDetail();
    await screen.findByText('Portal de Clientes');

    await user.click(screen.getByRole('button', { name: 'Editar projeto' }));

    const nameInput = screen.getByLabelText(/nome do projeto/i) as HTMLInputElement;
    expect(nameInput.value).toBe('Portal de Clientes');

    await user.clear(nameInput);
    await user.type(nameInput, 'Portal atualizado');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() => {
      expect(api.lastCall('PATCH', '/api/projects/1')?.body).toMatchObject({
        name: 'Portal atualizado',
      });
    });
  });

  it('exclui o projeto após confirmação', async () => {
    const api = installApiMock({
      ...baseRoutes(),
      'DELETE /api/projects/1': { status: 204, body: null },
    });
    const user = userEvent.setup();

    renderDetail();
    await screen.findByText('Portal de Clientes');

    await user.click(screen.getByRole('button', { name: 'Excluir' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Excluir projeto' }));

    await waitFor(() => {
      expect(api.callsTo('DELETE', '/api/projects/1')).toHaveLength(1);
    });
  });

  it('informa quando o projeto não existe', async () => {
    installApiMock({
      'GET /api/projects/1': { status: 404, body: { error: { message: 'Projeto não encontrado.' } } },
      'GET /api/tasks': [],
    });

    renderDetail();

    expect(await screen.findByText('Projeto não encontrado.')).toBeInTheDocument();
  });

  it('rejeita identificador de projeto inválido', async () => {
    installApiMock(baseRoutes());

    renderDetail('/projetos/abc');

    expect(await screen.findByText('Identificador de projeto inválido.')).toBeInTheDocument();
  });

  it('mostra estado vazio quando o projeto não tem tarefas', async () => {
    installApiMock({
      'GET /api/projects/1': projectFixture,
      'GET /api/tasks': [],
    });

    renderDetail();

    expect(await screen.findByText('Nenhuma tarefa neste projeto')).toBeInTheDocument();
  });
});
