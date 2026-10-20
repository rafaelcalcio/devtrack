import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { goalFixture } from '../test/fixtures';
import { installApiMock, renderWithProviders } from '../test/helpers';
import { GoalsPage } from './GoalsPage';

function baseRoutes() {
  return {
    'GET /api/goals': [goalFixture],
  };
}

describe('GoalsPage', () => {
  it('lista as metas com escopo, progresso e prazo', async () => {
    installApiMock(baseRoutes());

    renderWithProviders(<GoalsPage />);

    expect(await screen.findByText('Entregar a API de Pagamentos')).toBeInTheDocument();
    expect(screen.getAllByText('Profissional').length).toBeGreaterThan(0);
    expect(screen.getByText(/70%/)).toBeInTheDocument();
    expect(screen.getByText(/Prazo: 20\/03\/2026/)).toBeInTheDocument();
  });

  it('filtra por status, âmbito e busca', async () => {
    const api = installApiMock(baseRoutes());
    const user = userEvent.setup();

    renderWithProviders(<GoalsPage />);
    await screen.findByText('Entregar a API de Pagamentos');

    await user.selectOptions(screen.getByLabelText('Filtrar por status'), 'completed');
    await waitFor(() => {
      expect(api.lastCall('GET', '/api/goals')?.query.get('status')).toBe('completed');
    });

    await user.selectOptions(screen.getByLabelText('Filtrar por âmbito'), 'professional');
    await waitFor(() => {
      expect(api.lastCall('GET', '/api/goals')?.query.get('scope')).toBe('professional');
    });

    await user.type(screen.getByLabelText('Buscar metas pelo título'), 'API');
    await waitFor(
      () => {
        expect(api.lastCall('GET', '/api/goals')?.query.get('search')).toBe('API');
      },
      { timeout: 2000 },
    );
  });

  it('conclui uma meta em andamento', async () => {
    const api = installApiMock({
      ...baseRoutes(),
      'PATCH /api/goals/1': { ...goalFixture, status: 'completed', progress: 100 },
    });
    const user = userEvent.setup();

    renderWithProviders(<GoalsPage />);
    await screen.findByText('Entregar a API de Pagamentos');

    await user.click(screen.getByRole('button', { name: 'Concluir' }));

    await waitFor(() => {
      expect(api.lastCall('PATCH', '/api/goals/1')?.body).toEqual({ status: 'completed' });
    });

    expect(await screen.findByText('Meta concluída com sucesso.')).toBeInTheDocument();
  });

  it('cria uma meta com o progresso informado', async () => {
    const api = installApiMock({
      ...baseRoutes(),
      'POST /api/goals': { status: 201, body: goalFixture },
    });
    const user = userEvent.setup();

    renderWithProviders(<GoalsPage />);
    await screen.findByText('Entregar a API de Pagamentos');

    await user.click(screen.getByRole('button', { name: /nova meta/i }));
    await user.type(screen.getByLabelText(/^título/i), 'Meta de teste');
    await user.clear(screen.getByLabelText('Progresso (%)'));
    await user.type(screen.getByLabelText('Progresso (%)'), '60');
    await user.click(screen.getByRole('button', { name: 'Criar meta' }));

    await waitFor(() => {
      expect(api.lastCall('POST', '/api/goals')?.body).toMatchObject({
        title: 'Meta de teste',
        progress: 60,
      });
    });
  });

  it('impede o envio quando o progresso está fora de 0 a 100', async () => {
    const api = installApiMock(baseRoutes());
    const user = userEvent.setup();

    renderWithProviders(<GoalsPage />);
    await screen.findByText('Entregar a API de Pagamentos');

    await user.click(screen.getByRole('button', { name: /nova meta/i }));
    await user.type(screen.getByLabelText(/^título/i), 'Meta inválida');
    await user.clear(screen.getByLabelText('Progresso (%)'));
    await user.type(screen.getByLabelText('Progresso (%)'), '250');
    await user.click(screen.getByRole('button', { name: 'Criar meta' }));

    expect(await screen.findByText('O progresso deve estar entre 0 e 100.')).toBeInTheDocument();
    expect(api.callsTo('POST', '/api/goals')).toHaveLength(0);
  });

  it('edita uma meta existente', async () => {
    const api = installApiMock({
      ...baseRoutes(),
      'PATCH /api/goals/1': goalFixture,
    });
    const user = userEvent.setup();

    renderWithProviders(<GoalsPage />);
    await screen.findByText('Entregar a API de Pagamentos');

    await user.click(screen.getByRole('button', { name: 'Editar Entregar a API de Pagamentos' }));

    const titleInput = screen.getByLabelText(/^título/i) as HTMLInputElement;
    expect(titleInput.value).toBe('Entregar a API de Pagamentos');

    await user.clear(titleInput);
    await user.type(titleInput, 'Meta revisada');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() => {
      expect(api.lastCall('PATCH', '/api/goals/1')?.body).toMatchObject({ title: 'Meta revisada' });
    });
  });

  it('exclui uma meta após confirmação', async () => {
    const api = installApiMock({
      ...baseRoutes(),
      'DELETE /api/goals/1': { status: 204, body: null },
    });
    const user = userEvent.setup();

    renderWithProviders(<GoalsPage />);
    await screen.findByText('Entregar a API de Pagamentos');

    await user.click(screen.getByRole('button', { name: 'Excluir Entregar a API de Pagamentos' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Excluir meta' }));

    await waitFor(() => {
      expect(api.callsTo('DELETE', '/api/goals/1')).toHaveLength(1);
    });
  });

  it('mostra estado vazio quando não há metas', async () => {
    installApiMock({ 'GET /api/goals': [] });

    renderWithProviders(<GoalsPage />);

    expect(await screen.findByText('Nenhuma meta encontrada')).toBeInTheDocument();
  });
});
