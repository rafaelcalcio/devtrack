import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { otherProjectFixture, projectFixture } from '../test/fixtures';
import { installApiMock, renderWithProviders } from '../test/helpers';
import { ProjectsPage } from './ProjectsPage';

function baseRoutes() {
  return {
    'GET /api/projects': [projectFixture, otherProjectFixture],
  };
}

describe('ProjectsPage', () => {
  it('lista os projetos devolvidos pela API', async () => {
    installApiMock(baseRoutes());

    renderWithProviders(<ProjectsPage />);

    expect(await screen.findByText('Portal de Clientes')).toBeInTheDocument();
    expect(screen.getByText('API de Pagamentos')).toBeInTheDocument();
    expect(screen.getByText('1/4 tarefas concluídas')).toBeInTheDocument();
    expect(screen.getByText('1 atrasadas')).toBeInTheDocument();
  });

  it('filtra por status, prioridade e busca com debounce', async () => {
    const api = installApiMock(baseRoutes());
    const user = userEvent.setup();

    renderWithProviders(<ProjectsPage />);
    await screen.findByText('Portal de Clientes');

    await user.selectOptions(screen.getByLabelText('Filtrar por status'), 'active');
    await waitFor(() => {
      expect(api.lastCall('GET', '/api/projects')?.query.get('status')).toBe('active');
    });

    await user.selectOptions(screen.getByLabelText('Filtrar por prioridade'), 'high');
    await waitFor(() => {
      const call = api.lastCall('GET', '/api/projects');
      expect(call?.query.get('status')).toBe('active');
      expect(call?.query.get('priority')).toBe('high');
    });

    await user.type(screen.getByLabelText('Buscar projetos pelo nome'), 'Portal');
    await waitFor(
      () => {
        expect(api.lastCall('GET', '/api/projects')?.query.get('search')).toBe('Portal');
      },
      { timeout: 2000 },
    );
  });

  it('cria um projeto pelo formulário', async () => {
    const api = installApiMock({
      ...baseRoutes(),
      'POST /api/projects': { status: 201, body: projectFixture },
    });
    const user = userEvent.setup();

    renderWithProviders(<ProjectsPage />);
    await screen.findByText('Portal de Clientes');

    await user.click(screen.getByRole('button', { name: /novo projeto/i }));
    await user.type(screen.getByLabelText(/nome do projeto/i), 'Novo projeto');
    await user.click(screen.getByRole('button', { name: 'Criar projeto' }));

    await waitFor(() => {
      const call = api.lastCall('POST', '/api/projects');
      expect(call?.body).toMatchObject({ name: 'Novo projeto', status: 'planning' });
    });

    expect(await screen.findByText('Projeto criado com sucesso.')).toBeInTheDocument();
  });

  it('bloqueia o envio quando o nome está vazio', async () => {
    const api = installApiMock(baseRoutes());
    const user = userEvent.setup();

    renderWithProviders(<ProjectsPage />);
    await screen.findByText('Portal de Clientes');

    await user.click(screen.getByRole('button', { name: /novo projeto/i }));
    await user.click(screen.getByRole('button', { name: 'Criar projeto' }));

    expect(await screen.findByText('Informe o nome do projeto.')).toBeInTheDocument();
    expect(api.callsTo('POST', '/api/projects')).toHaveLength(0);
  });

  it('edita um projeto existente com os dados preenchidos', async () => {
    const api = installApiMock({
      ...baseRoutes(),
      'PATCH /api/projects/1': projectFixture,
    });
    const user = userEvent.setup();

    renderWithProviders(<ProjectsPage />);
    await screen.findByText('Portal de Clientes');

    await user.click(screen.getByRole('button', { name: 'Editar Portal de Clientes' }));

    const nameInput = screen.getByLabelText(/nome do projeto/i) as HTMLInputElement;
    expect(nameInput.value).toBe('Portal de Clientes');

    await user.clear(nameInput);
    await user.type(nameInput, 'Portal renomeado');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() => {
      expect(api.lastCall('PATCH', '/api/projects/1')?.body).toMatchObject({
        name: 'Portal renomeado',
      });
    });
  });

  it('exclui um projeto após a confirmação', async () => {
    const api = installApiMock({
      ...baseRoutes(),
      'DELETE /api/projects/1': { status: 204, body: null },
    });
    const user = userEvent.setup();

    renderWithProviders(<ProjectsPage />);
    await screen.findByText('Portal de Clientes');

    await user.click(screen.getByRole('button', { name: 'Excluir Portal de Clientes' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/Portal de Clientes/)).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Excluir projeto' }));

    await waitFor(() => {
      expect(api.callsTo('DELETE', '/api/projects/1')).toHaveLength(1);
    });
  });

  it('cancela a exclusão sem chamar a API', async () => {
    const api = installApiMock(baseRoutes());
    const user = userEvent.setup();

    renderWithProviders(<ProjectsPage />);
    await screen.findByText('Portal de Clientes');

    await user.click(screen.getByRole('button', { name: 'Excluir Portal de Clientes' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(api.callsTo('DELETE', '/api/projects/1')).toHaveLength(0);
  });

  it('mostra estado vazio com ação de criação', async () => {
    installApiMock({ 'GET /api/projects': [] });
    const user = userEvent.setup();

    renderWithProviders(<ProjectsPage />);

    expect(await screen.findByText('Nenhum projeto encontrado')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Criar projeto' }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('mostra erro e permite tentar novamente', async () => {
    let attempt = 0;
    const api = installApiMock({
      'GET /api/projects': () => {
        attempt += 1;
        return attempt === 1
          ? { status: 500, body: { error: { message: 'Erro interno do servidor.' } } }
          : [projectFixture];
      },
    });
    const user = userEvent.setup();

    renderWithProviders(<ProjectsPage />);

    expect(await screen.findByText('Não foi possível carregar')).toBeInTheDocument();
    expect(screen.getByText('Erro interno do servidor.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByText('Portal de Clientes')).toBeInTheDocument();
    expect(api.callsTo('GET', '/api/projects').length).toBeGreaterThan(1);
  });

  it('avisa quando o cadastro falha', async () => {
    installApiMock({
      ...baseRoutes(),
      'POST /api/projects': {
        status: 400,
        body: { error: { message: 'Dados inválidos.', details: { fields: [{ field: 'name', message: 'Informe o nome do projeto.' }] } } },
      },
    });
    const user = userEvent.setup();

    renderWithProviders(<ProjectsPage />);
    await screen.findByText('Portal de Clientes');

    await user.click(screen.getByRole('button', { name: /novo projeto/i }));
    await user.type(screen.getByLabelText(/nome do projeto/i), 'Repetido');
    await user.click(screen.getByRole('button', { name: 'Criar projeto' }));

    expect(await screen.findByText('Dados inválidos.')).toBeInTheDocument();
  });
});
