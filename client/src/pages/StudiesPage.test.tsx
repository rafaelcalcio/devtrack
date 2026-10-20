import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { sessionFixture, subjectFixture } from '../test/fixtures';
import { installApiMock, renderWithProviders } from '../test/helpers';
import { StudiesPage } from './StudiesPage';

const summary = {
  totalMinutes: 120,
  totalSessions: 2,
  averageSessionMinutes: 60,
  bySubject: [{ subjectId: 1, name: 'TypeScript', color: '#3178c6', minutes: 120, sessions: 2 }],
  byDay: [{ date: '2026-02-10', minutes: 60 }],
  subjectsCount: 1,
};

function baseRoutes() {
  return {
    'GET /api/study/subjects': [subjectFixture],
    'GET /api/study/sessions': [sessionFixture],
    'GET /api/study/summary': summary,
  };
}

describe('StudiesPage', () => {
  it('mostra os totais de estudo e os assuntos cadastrados', async () => {
    installApiMock(baseRoutes());

    renderWithProviders(<StudiesPage />);

    expect((await screen.findAllByText('TypeScript')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('2h').length).toBeGreaterThan(0);
    expect(screen.getByText('2 sessões')).toBeInTheDocument();
    expect(screen.getByText('Sessões registradas')).toBeInTheDocument();
  });

  it('cadastra um assunto de estudo', async () => {
    const api = installApiMock({
      ...baseRoutes(),
      'POST /api/study/subjects': { status: 201, body: subjectFixture },
    });
    const user = userEvent.setup();

    renderWithProviders(<StudiesPage />);
    await screen.findAllByText('TypeScript');

    await user.click(screen.getByRole('button', { name: /novo assunto/i }));
    await user.type(screen.getByLabelText(/^assunto/i), 'Rust');
    await user.click(screen.getByRole('button', { name: 'Cadastrar assunto' }));

    await waitFor(() => {
      expect(api.lastCall('POST', '/api/study/subjects')?.body).toMatchObject({ name: 'Rust' });
    });

    expect(await screen.findByText('Assunto cadastrado com sucesso.')).toBeInTheDocument();
  });

  it('edita um assunto de estudo', async () => {
    const api = installApiMock({
      ...baseRoutes(),
      'PATCH /api/study/subjects/1': subjectFixture,
    });
    const user = userEvent.setup();

    renderWithProviders(<StudiesPage />);
    await screen.findAllByText('TypeScript');

    await user.click(screen.getByRole('button', { name: 'Editar TypeScript' }));

    const nameInput = screen.getByLabelText(/^assunto/i) as HTMLInputElement;
    expect(nameInput.value).toBe('TypeScript');

    await user.clear(nameInput);
    await user.type(nameInput, 'TypeScript avançado');
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() => {
      expect(api.lastCall('PATCH', '/api/study/subjects/1')?.body).toMatchObject({
        name: 'TypeScript avançado',
      });
    });
  });

  it('exclui um assunto após confirmação', async () => {
    const api = installApiMock({
      ...baseRoutes(),
      'DELETE /api/study/subjects/1': { status: 204, body: null },
    });
    const user = userEvent.setup();

    renderWithProviders(<StudiesPage />);
    await screen.findAllByText('TypeScript');

    await user.click(screen.getByRole('button', { name: 'Excluir TypeScript' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Excluir assunto' }));

    await waitFor(() => {
      expect(api.callsTo('DELETE', '/api/study/subjects/1')).toHaveLength(1);
    });
  });

  it('registra uma sessão de estudo', async () => {
    const api = installApiMock({
      ...baseRoutes(),
      'POST /api/study/sessions': { status: 201, body: sessionFixture },
    });
    const user = userEvent.setup();

    renderWithProviders(<StudiesPage />);
    await screen.findAllByText('TypeScript');

    await user.click(screen.getByRole('button', { name: /registrar sessão/i }));

    const dialog = await screen.findByRole('dialog');
    await user.clear(within(dialog).getByLabelText(/duração \(minutos\)/i));
    await user.type(within(dialog).getByLabelText(/duração \(minutos\)/i), '45');
    await user.type(within(dialog).getByLabelText('Anotações'), ' generics ');
    await user.click(within(dialog).getByRole('button', { name: 'Registrar sessão' }));

    await waitFor(() => {
      expect(api.lastCall('POST', '/api/study/sessions')?.body).toMatchObject({
        subjectId: 1,
        durationMinutes: 45,
        notes: 'generics',
      });
    });
  });

  it('edita uma sessão de estudo existente', async () => {
    const api = installApiMock({
      ...baseRoutes(),
      'PATCH /api/study/sessions/1': sessionFixture,
    });
    const user = userEvent.setup();

    renderWithProviders(<StudiesPage />);
    await screen.findAllByText('TypeScript');

    await user.click(screen.getByRole('button', { name: /editar sessão/i }));

    const dialog = await screen.findByRole('dialog');
    const durationInput = within(dialog).getByLabelText(/duração \(minutos\)/i) as HTMLInputElement;
    expect(durationInput.value).toBe('60');

    await user.clear(durationInput);
    await user.type(durationInput, '90');
    await user.click(within(dialog).getByRole('button', { name: 'Salvar alterações' }));

    await waitFor(() => {
      expect(api.lastCall('PATCH', '/api/study/sessions/1')?.body).toMatchObject({
        durationMinutes: 90,
      });
    });

    expect(await screen.findByText('Sessão atualizada com sucesso.')).toBeInTheDocument();
  });

  it('exclui uma sessão após confirmação', async () => {
    const api = installApiMock({
      ...baseRoutes(),
      'DELETE /api/study/sessions/1': { status: 204, body: null },
    });
    const user = userEvent.setup();

    renderWithProviders(<StudiesPage />);
    await screen.findAllByText('TypeScript');

    await user.click(screen.getByRole('button', { name: 'Excluir sessão' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Excluir sessão' }));

    await waitFor(() => {
      expect(api.callsTo('DELETE', '/api/study/sessions/1')).toHaveLength(1);
    });
  });

  it('filtra o histórico por assunto e período', async () => {
    const api = installApiMock(baseRoutes());
    const user = userEvent.setup();

    renderWithProviders(<StudiesPage />);
    await screen.findAllByText('TypeScript');

    await user.selectOptions(screen.getByLabelText('Filtrar sessões por assunto'), '1');
    await waitFor(() => {
      expect(api.lastCall('GET', '/api/study/sessions')?.query.get('subjectId')).toBe('1');
    });

    await user.type(screen.getByLabelText('Filtrar sessões a partir de'), '2026-02-01');
    await waitFor(() => {
      expect(api.lastCall('GET', '/api/study/sessions')?.query.get('from')).toBe('2026-02-01');
    });

    await user.type(screen.getByLabelText('Filtrar sessões até'), '2026-02-28');
    await waitFor(() => {
      expect(api.lastCall('GET', '/api/study/sessions')?.query.get('to')).toBe('2026-02-28');
    });
  });

  it('desabilita o registro de sessão quando não há assuntos', async () => {
    installApiMock({
      'GET /api/study/subjects': [],
      'GET /api/study/sessions': [],
      'GET /api/study/summary': { ...summary, totalMinutes: 0, totalSessions: 0, subjectsCount: 0 },
    });

    renderWithProviders(<StudiesPage />);

    expect(await screen.findByText('Nenhum assunto cadastrado')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /registrar sessão/i })).toBeDisabled();
  });
});
