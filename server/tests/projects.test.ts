import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestContext } from './helpers.js';

describe('API de projetos', () => {
  let context: TestContext;

  beforeEach(() => {
    context = createTestApp();
  });

  it('cria um projeto com os dados informados', async () => {
    const response = await request(context.app).post('/api/projects').send({
      name: 'Portal de Clientes',
      description: 'Painel para clientes',
      category: 'Web',
      status: 'active',
      priority: 'high',
      color: '#6366f1',
      startDate: '2026-01-01',
      dueDate: '2026-02-01',
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: 1,
      name: 'Portal de Clientes',
      description: 'Painel para clientes',
      category: 'Web',
      status: 'active',
      priority: 'high',
      color: '#6366f1',
      startDate: '2026-01-01',
      dueDate: '2026-02-01',
    });
    expect(response.body.progress).toBe(0);
    expect(response.body.totalTasks).toBe(0);
  });

  it('aplica valores padrão quando os campos são omitidos', async () => {
    const response = await request(context.app).post('/api/projects').send({ name: 'Projeto mínimo' });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      name: 'Projeto mínimo',
      description: '',
      category: 'Geral',
      status: 'planning',
      priority: 'medium',
      color: '#6366f1',
      startDate: null,
      dueDate: null,
    });
  });

  it('rejeita projeto sem nome', async () => {
    const response = await request(context.app).post('/api/projects').send({ description: 'Sem nome' });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Dados inválidos.');
    expect(response.body.error.details.fields[0].field).toBe('name');
  });

  it('rejeita status, prioridade e cor inválidos', async () => {
    const response = await request(context.app).post('/api/projects').send({
      name: 'Projeto inválido',
      status: 'inexistente',
      priority: 'imediata',
      color: 'azul',
    });

    expect(response.status).toBe(400);
    const fields = response.body.error.details.fields.map((field: { field: string }) => field.field);
    expect(fields).toContain('status');
    expect(fields).toContain('priority');
    expect(fields).toContain('color');
  });

  it('rejeita prazo anterior à data de início', async () => {
    const response = await request(context.app).post('/api/projects').send({
      name: 'Projeto com datas',
      startDate: '2026-03-10',
      dueDate: '2026-03-01',
    });

    expect(response.status).toBe(400);
    expect(response.body.error.details.fields[0].field).toBe('dueDate');
  });

  it('lista, filtra e busca projetos', async () => {
    await request(context.app).post('/api/projects').send({
      name: 'Portal de Clientes',
      status: 'active',
      priority: 'high',
    });
    await request(context.app).post('/api/projects').send({
      name: 'Blog Técnico',
      status: 'paused',
      priority: 'low',
    });

    const all = await request(context.app).get('/api/projects');
    expect(all.status).toBe(200);
    expect(all.body).toHaveLength(2);

    const byStatus = await request(context.app).get('/api/projects').query({ status: 'active' });
    expect(byStatus.body).toHaveLength(1);
    expect(byStatus.body[0].name).toBe('Portal de Clientes');

    const byPriority = await request(context.app).get('/api/projects').query({ priority: 'low' });
    expect(byPriority.body).toHaveLength(1);
    expect(byPriority.body[0].name).toBe('Blog Técnico');

    const bySearch = await request(context.app).get('/api/projects').query({ search: 'blog' });
    expect(bySearch.body).toHaveLength(1);
    expect(bySearch.body[0].name).toBe('Blog Técnico');
  });

  it('atualiza um projeto existente', async () => {
    const created = await request(context.app)
      .post('/api/projects')
      .send({ name: 'Projeto Original', priority: 'low' });

    const response = await request(context.app)
      .patch(`/api/projects/${created.body.id}`)
      .send({ name: 'Projeto Atualizado', priority: 'urgent' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      name: 'Projeto Atualizado',
      priority: 'urgent',
      status: 'planning',
    });
  });

  it('retorna 404 ao atualizar projeto inexistente', async () => {
    const response = await request(context.app).patch('/api/projects/999').send({ name: 'Qualquer' });

    expect(response.status).toBe(404);
    expect(response.body.error.message).toBe('Projeto não encontrado.');
  });

  it('remove o projeto e as tarefas vinculadas sem deixar tarefas órfãs', async () => {
    const project = await request(context.app).post('/api/projects').send({ name: 'Projeto temporário' });
    const projectId = project.body.id;

    await request(context.app).post('/api/tasks').send({ title: 'Tarefa do projeto', projectId });
    await request(context.app).post('/api/tasks').send({ title: 'Tarefa sem projeto' });

    const before = await request(context.app).get('/api/tasks');
    expect(before.body).toHaveLength(2);

    const response = await request(context.app).delete(`/api/projects/${projectId}`);
    expect(response.status).toBe(204);

    const after = await request(context.app).get('/api/tasks');
    expect(after.body).toHaveLength(1);
    expect(after.body[0].title).toBe('Tarefa sem projeto');

    const tasksRaw = context.db.prepare(`SELECT * FROM tasks`).all();
    expect(tasksRaw).toHaveLength(1);
  });

  it('calcula o progresso do projeto a partir das tarefas concluídas', async () => {
    const project = await request(context.app).post('/api/projects').send({ name: 'Projeto com tarefas' });
    const projectId = project.body.id;

    await request(context.app).post('/api/tasks').send({ title: 'A', projectId });
    await request(context.app).post('/api/tasks').send({ title: 'B', projectId });
    await request(context.app).post('/api/tasks').send({ title: 'C', projectId });
    await request(context.app).post('/api/tasks').send({ title: 'D', projectId });

    const done = await request(context.app)
      .post('/api/tasks')
      .send({ title: 'Concluída', projectId, status: 'done' });

    expect(done.status).toBe(201);

    const response = await request(context.app).get(`/api/projects/${projectId}`);
    expect(response.body.totalTasks).toBe(5);
    expect(response.body.completedTasks).toBe(1);
    expect(response.body.progress).toBe(20);
  });
});
