import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestContext } from './helpers.js';

describe('Dashboard e rotas principais da API', () => {
  let context: TestContext;

  beforeEach(() => {
    context = createTestApp();
  });

  it('responde ao health check', async () => {
    const response = await request(context.app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: 'ok',
      service: 'devtrack-api',
      database: 'connected',
    });
    expect(typeof response.body.uptimeSeconds).toBe('number');
  });

  it('devolve 404 com mensagem padronizada para rotas inexistentes', async () => {
    const response = await request(context.app).get('/api/rota-inexistente');

    expect(response.status).toBe(404);
    expect(response.body.error.message).toContain('Rota não encontrada');
  });

  it('calcula os totais do dashboard a partir do banco de dados', async () => {
    const project = await request(context.app).post('/api/projects').send({ name: 'Projeto', status: 'active' });
    await request(context.app).post('/api/tasks').send({ title: 'Tarefa A', projectId: project.body.id });
    await request(context.app).post('/api/tasks').send({ title: 'Tarefa B', projectId: project.body.id });
    await request(context.app).post('/api/tasks').send({ title: 'Tarefa C', status: 'done' });

    const response = await request(context.app).get('/api/dashboard');

    expect(response.status).toBe(200);
    expect(response.body.totals.projects).toBe(1);
    expect(response.body.totals.activeProjects).toBe(1);
    expect(response.body.totals.tasks).toBe(3);
    expect(response.body.totals.pendingTasks).toBe(2);
    expect(response.body.totals.completedTasks).toBe(1);
    expect(response.body.tasksByStatus).toEqual(
      expect.arrayContaining([
        { status: 'todo', count: 2 },
        { status: 'done', count: 1 },
      ]),
    );
    expect(response.body.overallProgress).toBe(0);
    expect(response.body.productivity).toHaveLength(14);
    expect(response.body.studyByDay).toHaveLength(7);
  });

  it('registra atividades recentes ao criar tarefas', async () => {
    await request(context.app).post('/api/tasks').send({ title: 'Tarefa registrada' });

    const response = await request(context.app).get('/api/dashboard');

    expect(response.body.recentActivities.length).toBeGreaterThan(0);
    expect(response.body.recentActivities[0].title).toContain('Tarefa registrada');
  });

  it('lista os itens do calendário do mês informado', async () => {
    const project = await request(context.app)
      .post('/api/projects')
      .send({ name: 'Projeto do calendário', startDate: '2026-04-02', dueDate: '2026-04-20' });
    await request(context.app)
      .post('/api/tasks')
      .send({ title: 'Tarefa com prazo', projectId: project.body.id, dueDate: '2026-04-10' });
    await request(context.app)
      .post('/api/goals')
      .send({ title: 'Meta com prazo', dueDate: '2026-04-15' });

    const response = await request(context.app).get('/api/calendar').query({ month: '2026-04' });

    expect(response.status).toBe(200);
    expect(response.body.month).toBe('2026-04');
    expect(response.body.items).toHaveLength(4);
    expect(response.body.items.map((item: { type: string }) => item.type)).toEqual(
      expect.arrayContaining(['task', 'project', 'goal']),
    );
  });

  it('rejeita mês inválido no calendário', async () => {
    const response = await request(context.app).get('/api/calendar').query({ month: 'abril' });

    expect(response.status).toBe(400);
  });

  it('aplica CORS para as origens permitidas', async () => {
    const response = await request(context.app)
      .get('/api/health')
      .set('Origin', 'http://localhost:5173');

    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });

  it('retorna 400 com mensagem amigável para JSON malformado', async () => {
    const response = await request(context.app)
      .post('/api/projects')
      .set('Content-Type', 'application/json')
      .send('{"name": ');

    expect(response.status).toBe(400);
    expect(response.body.error.message).toContain('JSON');
    expect(JSON.stringify(response.body)).not.toContain('at ');
  });
});
