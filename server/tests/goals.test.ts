import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestContext } from './helpers.js';

describe('API de metas', () => {
  let context: TestContext;

  beforeEach(() => {
    context = createTestApp();
  });

  it('cria uma meta válida', async () => {
    const response = await request(context.app).post('/api/goals').send({
      title: 'Entregar a API de Pagamentos',
      description: 'Fechar conciliação e idempotência',
      scope: 'professional',
      progress: 25,
      dueDate: '2026-08-01',
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      title: 'Entregar a API de Pagamentos',
      scope: 'professional',
      progress: 25,
      status: 'active',
      dueDate: '2026-08-01',
      completedAt: null,
    });
  });

  it('rejeita meta sem título', async () => {
    const response = await request(context.app).post('/api/goals').send({ description: 'Sem título' });

    expect(response.status).toBe(400);
    expect(response.body.error.details.fields[0].field).toBe('title');
  });

  it('rejeita progresso fora do intervalo permitido', async () => {
    const response = await request(context.app)
      .post('/api/goals')
      .send({ title: 'Meta inválida', progress: 140 });

    expect(response.status).toBe(400);
    expect(response.body.error.details.fields[0].field).toBe('progress');
  });

  it('rejeita escopo inválido', async () => {
    const response = await request(context.app)
      .post('/api/goals')
      .send({ title: 'Meta inválida', scope: 'corporativa' });

    expect(response.status).toBe(400);
    expect(response.body.error.details.fields[0].field).toBe('scope');
  });

  it('atualiza o progresso da meta', async () => {
    const created = await request(context.app).post('/api/goals').send({ title: 'Meta' });

    const response = await request(context.app)
      .patch(`/api/goals/${created.body.id}`)
      .send({ progress: 60 });

    expect(response.status).toBe(200);
    expect(response.body.progress).toBe(60);
    expect(response.body.status).toBe('active');
  });

  it('conclui a meta ao marcar o status como concluída', async () => {
    const created = await request(context.app).post('/api/goals').send({ title: 'Meta' });

    const response = await request(context.app)
      .patch(`/api/goals/${created.body.id}`)
      .send({ status: 'completed' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('completed');
    expect(response.body.progress).toBe(100);
    expect(response.body.completedAt).not.toBeNull();
  });

  it('filtra metas por status e escopo', async () => {
    await request(context.app).post('/api/goals').send({ title: 'Meta ativa', scope: 'personal' });
    await request(context.app)
      .post('/api/goals')
      .send({ title: 'Meta concluída', scope: 'professional', status: 'completed' });

    const active = await request(context.app).get('/api/goals').query({ status: 'active' });
    expect(active.body).toHaveLength(1);
    expect(active.body[0].title).toBe('Meta ativa');

    const professional = await request(context.app).get('/api/goals').query({ scope: 'professional' });
    expect(professional.body).toHaveLength(1);
    expect(professional.body[0].title).toBe('Meta concluída');
  });

  it('remove uma meta', async () => {
    const created = await request(context.app).post('/api/goals').send({ title: 'Meta' });

    const response = await request(context.app).delete(`/api/goals/${created.body.id}`);
    expect(response.status).toBe(204);

    const list = await request(context.app).get('/api/goals');
    expect(list.body).toHaveLength(0);
  });
});
