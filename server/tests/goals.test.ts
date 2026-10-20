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

  it('busca uma meta pelo identificador', async () => {
    const created = await request(context.app).post('/api/goals').send({ title: 'Meta alvo' });

    const response = await request(context.app).get(`/api/goals/${created.body.id}`);

    expect(response.status).toBe(200);
    expect(response.body.title).toBe('Meta alvo');
  });

  it('retorna 404 ao buscar meta inexistente', async () => {
    const response = await request(context.app).get('/api/goals/999');

    expect(response.status).toBe(404);
    expect(response.body.error.message).toBe('Meta não encontrada.');
  });

  it('aceita PUT como alternativa ao PATCH', async () => {
    const created = await request(context.app).post('/api/goals').send({ title: 'Meta original' });

    const response = await request(context.app)
      .put(`/api/goals/${created.body.id}`)
      .send({ title: 'Meta via PUT' });

    expect(response.status).toBe(200);
    expect(response.body.title).toBe('Meta via PUT');
  });

  it('reabre uma meta concluída e limpa a data de conclusão', async () => {
    const created = await request(context.app)
      .post('/api/goals')
      .send({ title: 'Meta concluída', status: 'completed' });

    const response = await request(context.app)
      .patch(`/api/goals/${created.body.id}`)
      .send({ status: 'active' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('active');
    expect(response.body.completedAt).toBeNull();
  });

  it('cancela uma meta mantendo o progresso informado', async () => {
    const created = await request(context.app).post('/api/goals').send({ title: 'Meta', progress: 40 });

    const response = await request(context.app)
      .patch(`/api/goals/${created.body.id}`)
      .send({ status: 'cancelled' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('cancelled');
    expect(response.body.progress).toBe(40);
  });

  it('busca metas pelo título', async () => {
    await request(context.app).post('/api/goals').send({ title: 'Aprender arquitetura limpa' });
    await request(context.app).post('/api/goals').send({ title: 'Escrever testes' });

    const response = await request(context.app).get('/api/goals').query({ search: 'arquitetura' });

    expect(response.body).toHaveLength(1);
    expect(response.body[0].title).toBe('Aprender arquitetura limpa');
  });

  it('remove uma meta', async () => {
    const created = await request(context.app).post('/api/goals').send({ title: 'Meta' });

    const response = await request(context.app).delete(`/api/goals/${created.body.id}`);
    expect(response.status).toBe(204);

    const list = await request(context.app).get('/api/goals');
    expect(list.body).toHaveLength(0);
  });
});
