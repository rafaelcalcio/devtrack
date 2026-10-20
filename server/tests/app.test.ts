import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { todayISO } from '../src/lib/dates.js';
import { createTestApp, type TestContext } from './helpers.js';

describe('Comportamento geral da API', () => {
  let context: TestContext;

  beforeEach(() => {
    context = createTestApp();
  });

  it('não expõe o cabeçalho x-powered-by', async () => {
    const response = await request(context.app).get('/api/health');

    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  it('responde ao preflight de CORS da origem permitida', async () => {
    const response = await request(context.app)
      .options('/api/projects')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'POST');

    expect(response.status).toBeLessThan(300);
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(response.headers['access-control-allow-methods']).toContain('POST');
  });

  it('não aplica CORS em origens não permitidas', async () => {
    const response = await request(context.app)
      .get('/api/health')
      .set('Origin', 'http://origem-indevida.test');

    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('devolve 404 padronizado para métodos não suportados', async () => {
    const response = await request(context.app).patch('/api/health').send({});

    expect(response.status).toBe(404);
    expect(response.body.error.message).toContain('Rota não encontrada');
  });

  it('rejeita parâmetros de consulta inválidos', async () => {
    const tasks = await request(context.app).get('/api/tasks').query({ status: 'inexistente' });
    expect(tasks.status).toBe(400);
    expect(tasks.body.error.message).toBe('Dados inválidos.');

    const goals = await request(context.app).get('/api/goals').query({ scope: 'inexistente' });
    expect(goals.status).toBe(400);

    const projects = await request(context.app).get('/api/projects').query({ priority: 'imediata' });
    expect(projects.status).toBe(400);
  });

  it('rejeita identificadores inválidos nas rotas de recurso', async () => {
    const project = await request(context.app).get('/api/projects/abc');
    expect(project.status).toBe(400);

    const task = await request(context.app).get('/api/tasks/0');
    expect(task.status).toBe(400);

    const goal = await request(context.app).delete('/api/goals/-1');
    expect(goal.status).toBe(400);
  });

  it('contabiliza a tarefa concluída no dia local atual', async () => {
    await request(context.app).post('/api/tasks').send({ title: 'Tarefa concluída agora', status: 'done' });

    const response = await request(context.app).get('/api/dashboard');

    const today = response.body.productivity.find(
      (entry: { date: string }) => entry.date === todayISO(),
    );

    expect(today).toBeDefined();
    expect(today.completed).toBe(1);
  });

  it('mantém o filtro de atrasadas funcionando com o parâmetro overdue', async () => {
    const overdue = await request(context.app).get('/api/tasks').query({ overdue: 'false' });
    expect(overdue.status).toBe(200);
    expect(Array.isArray(overdue.body)).toBe(true);

    const invalid = await request(context.app).get('/api/tasks').query({ overdue: 'talvez' });
    expect(invalid.status).toBe(400);
  });

  it('responde com 204 e corpo vazio nas exclusões', async () => {
    const created = await request(context.app).post('/api/tasks').send({ title: 'Tarefa' });

    const response = await request(context.app).delete(`/api/tasks/${created.body.id}`);

    expect(response.status).toBe(204);
    expect(response.text).toBe('');
  });
});
