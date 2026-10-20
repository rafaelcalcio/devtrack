import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestContext } from './helpers.js';

function daysFromToday(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

describe('API de tarefas', () => {
  let context: TestContext;

  beforeEach(() => {
    context = createTestApp();
  });

  it('cria uma tarefa associada a um projeto', async () => {
    const project = await request(context.app).post('/api/projects').send({ name: 'Projeto' });

    const response = await request(context.app).post('/api/tasks').send({
      title: 'Implementar login',
      description: 'Tela de login',
      projectId: project.body.id,
      priority: 'high',
      category: 'Frontend',
      dueDate: '2027-05-10',
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      title: 'Implementar login',
      description: 'Tela de login',
      projectId: project.body.id,
      projectName: 'Projeto',
      status: 'todo',
      priority: 'high',
      category: 'Frontend',
      dueDate: '2027-05-10',
      completedAt: null,
      overdue: false,
    });
  });

  it('rejeita tarefa sem título', async () => {
    const response = await request(context.app).post('/api/tasks').send({ description: 'Sem título' });

    expect(response.status).toBe(400);
    expect(response.body.error.details.fields[0].field).toBe('title');
  });

  it('rejeita tarefa vinculada a projeto inexistente', async () => {
    const response = await request(context.app)
      .post('/api/tasks')
      .send({ title: 'Tarefa órfã', projectId: 4242 });

    expect(response.status).toBe(400);
    expect(response.body.error.details.fields[0].field).toBe('projectId');
  });

  it('atualiza uma tarefa existente', async () => {
    const created = await request(context.app).post('/api/tasks').send({ title: 'Tarefa original' });

    const response = await request(context.app)
      .patch(`/api/tasks/${created.body.id}`)
      .send({ title: 'Tarefa revisada', priority: 'urgent', dueDate: '2026-06-01' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      title: 'Tarefa revisada',
      priority: 'urgent',
      dueDate: '2026-06-01',
      status: 'todo',
    });
  });

  it('altera o status da tarefa e registra a conclusão', async () => {
    const created = await request(context.app).post('/api/tasks').send({ title: 'Tarefa' });

    const response = await request(context.app)
      .patch(`/api/tasks/${created.body.id}/status`)
      .send({ status: 'done' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('done');
    expect(response.body.completedAt).not.toBeNull();
  });

  it('rejeita status inválido', async () => {
    const created = await request(context.app).post('/api/tasks').send({ title: 'Tarefa' });

    const response = await request(context.app)
      .patch(`/api/tasks/${created.body.id}/status`)
      .send({ status: 'qualquer' });

    expect(response.status).toBe(400);
  });

  it('limpa a conclusão quando a tarefa volta para pendente', async () => {
    const created = await request(context.app)
      .post('/api/tasks')
      .send({ title: 'Tarefa', status: 'done' });

    const response = await request(context.app)
      .patch(`/api/tasks/${created.body.id}/status`)
      .send({ status: 'todo' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('todo');
    expect(response.body.completedAt).toBeNull();
  });

  it('filtra tarefas por status, prioridade e projeto', async () => {
    const project = await request(context.app).post('/api/projects').send({ name: 'Projeto A' });
    const other = await request(context.app).post('/api/projects').send({ name: 'Projeto B' });

    await request(context.app).post('/api/tasks').send({
      title: 'Tarefa do projeto A',
      projectId: project.body.id,
      status: 'in_progress',
      priority: 'high',
    });
    await request(context.app)
      .post('/api/tasks')
      .send({ title: 'Tarefa do projeto B', projectId: other.body.id, priority: 'low' });

    const byStatus = await request(context.app).get('/api/tasks').query({ status: 'in_progress' });
    expect(byStatus.body).toHaveLength(1);
    expect(byStatus.body[0].title).toBe('Tarefa do projeto A');

    const byPriority = await request(context.app).get('/api/tasks').query({ priority: 'low' });
    expect(byPriority.body).toHaveLength(1);
    expect(byPriority.body[0].projectName).toBe('Projeto B');

    const byProject = await request(context.app)
      .get('/api/tasks')
      .query({ projectId: project.body.id });
    expect(byProject.body).toHaveLength(1);
    expect(byProject.body[0].title).toBe('Tarefa do projeto A');
  });

  it('busca tarefas pelo título', async () => {
    await request(context.app).post('/api/tasks').send({ title: 'Escrever documentação da API' });
    await request(context.app).post('/api/tasks').send({ title: 'Corrigir bug do login' });

    const response = await request(context.app).get('/api/tasks').query({ search: 'documentação' });

    expect(response.body).toHaveLength(1);
    expect(response.body[0].title).toBe('Escrever documentação da API');
  });

  it('identifica tarefas atrasadas', async () => {
    await request(context.app)
      .post('/api/tasks')
      .send({ title: 'Tarefa atrasada', dueDate: daysFromToday(-3) });
    await request(context.app)
      .post('/api/tasks')
      .send({ title: 'Tarefa no prazo', dueDate: daysFromToday(3) });
    await request(context.app)
      .post('/api/tasks')
      .send({ title: 'Tarefa atrasada concluída', dueDate: daysFromToday(-3), status: 'done' });

    const list = await request(context.app).get('/api/tasks');
    const overdue = list.body.filter((task: { overdue: boolean }) => task.overdue);
    expect(overdue).toHaveLength(1);
    expect(overdue[0].title).toBe('Tarefa atrasada');

    const filtered = await request(context.app).get('/api/tasks').query({ overdue: 'true' });
    expect(filtered.body).toHaveLength(1);
    expect(filtered.body[0].title).toBe('Tarefa atrasada');
  });

  it('busca uma tarefa pelo identificador', async () => {
    const created = await request(context.app).post('/api/tasks').send({ title: 'Tarefa alvo' });

    const response = await request(context.app).get(`/api/tasks/${created.body.id}`);

    expect(response.status).toBe(200);
    expect(response.body.title).toBe('Tarefa alvo');
  });

  it('retorna 404 ao buscar tarefa inexistente', async () => {
    const response = await request(context.app).get('/api/tasks/9999');

    expect(response.status).toBe(404);
    expect(response.body.error.message).toBe('Tarefa não encontrada.');
  });

  it('aceita PUT como alternativa ao PATCH', async () => {
    const created = await request(context.app).post('/api/tasks').send({ title: 'Tarefa original' });

    const response = await request(context.app)
      .put(`/api/tasks/${created.body.id}`)
      .send({ title: 'Tarefa via PUT' });

    expect(response.status).toBe(200);
    expect(response.body.title).toBe('Tarefa via PUT');
  });

  it('filtra tarefas por categoria', async () => {
    await request(context.app).post('/api/tasks').send({ title: 'Backend', category: 'Backend' });
    await request(context.app).post('/api/tasks').send({ title: 'Frontend', category: 'Frontend' });

    const response = await request(context.app).get('/api/tasks').query({ category: 'Backend' });

    expect(response.body).toHaveLength(1);
    expect(response.body[0].title).toBe('Backend');
  });

  it('ordena as tarefas por status, prioridade e prazo', async () => {
    await request(context.app)
      .post('/api/tasks')
      .send({ title: 'Urgente pendente', status: 'todo', priority: 'urgent' });
    await request(context.app)
      .post('/api/tasks')
      .send({ title: 'Em andamento', status: 'in_progress', priority: 'low' });
    await request(context.app)
      .post('/api/tasks')
      .send({ title: 'Concluída', status: 'done', priority: 'low' });

    const response = await request(context.app).get('/api/tasks');

    expect(response.body.map((task: { title: string }) => task.title)).toEqual([
      'Em andamento',
      'Urgente pendente',
      'Concluída',
    ]);
  });

  it('desvincula a tarefa do projeto quando o projeto é enviado como vazio', async () => {
    const project = await request(context.app).post('/api/projects').send({ name: 'Projeto' });
    const created = await request(context.app)
      .post('/api/tasks')
      .send({ title: 'Tarefa vinculada', projectId: project.body.id });

    const response = await request(context.app)
      .patch(`/api/tasks/${created.body.id}`)
      .send({ projectId: null });

    expect(response.status).toBe(200);
    expect(response.body.projectId).toBeNull();
    expect(response.body.projectName).toBeNull();
  });

  it('remove uma tarefa', async () => {
    const created = await request(context.app).post('/api/tasks').send({ title: 'Temporária' });

    const response = await request(context.app).delete(`/api/tasks/${created.body.id}`);
    expect(response.status).toBe(204);

    const list = await request(context.app).get('/api/tasks');
    expect(list.body).toHaveLength(0);
  });

  it('retorna 404 ao remover tarefa inexistente', async () => {
    const response = await request(context.app).delete('/api/tasks/9999');
    expect(response.status).toBe(404);
  });
});
