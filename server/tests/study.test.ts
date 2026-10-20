import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, type TestContext } from './helpers.js';

describe('API de estudos', () => {
  let context: TestContext;

  beforeEach(() => {
    context = createTestApp();
  });

  it('cadastra um assunto de estudo', async () => {
    const response = await request(context.app).post('/api/study/subjects').send({
      name: 'TypeScript',
      technology: 'TypeScript 5',
      color: '#3178c6',
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      name: 'TypeScript',
      technology: 'TypeScript 5',
      color: '#3178c6',
      totalMinutes: 0,
      sessionCount: 0,
    });
  });

  it('não permite assuntos duplicados', async () => {
    await request(context.app).post('/api/study/subjects').send({ name: 'React' });

    const response = await request(context.app).post('/api/study/subjects').send({ name: 'react' });

    expect(response.status).toBe(409);
    expect(response.body.error.message).toContain('Já existe');
  });

  it('registra uma sessão de estudo e soma o tempo total', async () => {
    const subject = await request(context.app)
      .post('/api/study/subjects')
      .send({ name: 'Node.js' });

    const session = await request(context.app).post('/api/study/sessions').send({
      subjectId: subject.body.id,
      studiedOn: '2026-04-10',
      durationMinutes: 90,
      notes: 'Middlewares',
    });

    expect(session.status).toBe(201);
    expect(session.body).toMatchObject({
      subjectId: subject.body.id,
      subjectName: 'Node.js',
      durationMinutes: 90,
      studiedOn: '2026-04-10',
    });

    await request(context.app).post('/api/study/sessions').send({
      subjectId: subject.body.id,
      studiedOn: '2026-04-11',
      durationMinutes: 30,
    });

    const subjects = await request(context.app).get('/api/study/subjects');
    expect(subjects.body[0].totalMinutes).toBe(120);
    expect(subjects.body[0].sessionCount).toBe(2);

    const summary = await request(context.app).get('/api/study/summary');
    expect(summary.body.totalMinutes).toBe(120);
    expect(summary.body.totalSessions).toBe(2);
    expect(summary.body.averageSessionMinutes).toBe(60);
    expect(summary.body.bySubject[0]).toMatchObject({ name: 'Node.js', minutes: 120, sessions: 2 });
  });

  it('rejeita sessão sem assunto válido', async () => {
    const response = await request(context.app).post('/api/study/sessions').send({
      subjectId: 999,
      studiedOn: '2026-04-10',
      durationMinutes: 30,
    });

    expect(response.status).toBe(400);
    expect(response.body.error.details.fields[0].field).toBe('subjectId');
  });

  it('rejeita duração inválida', async () => {
    const subject = await request(context.app).post('/api/study/subjects').send({ name: 'SQL' });

    const response = await request(context.app).post('/api/study/sessions').send({
      subjectId: subject.body.id,
      studiedOn: '2026-04-10',
      durationMinutes: 0,
    });

    expect(response.status).toBe(400);
    expect(response.body.error.details.fields[0].field).toBe('durationMinutes');
  });

  it('filtra o histórico de sessões por assunto e período', async () => {
    const first = await request(context.app).post('/api/study/subjects').send({ name: 'React' });
    const second = await request(context.app).post('/api/study/subjects').send({ name: 'SQL' });

    await request(context.app).post('/api/study/sessions').send({
      subjectId: first.body.id,
      studiedOn: '2026-04-01',
      durationMinutes: 30,
    });
    await request(context.app).post('/api/study/sessions').send({
      subjectId: second.body.id,
      studiedOn: '2026-04-05',
      durationMinutes: 45,
    });

    const bySubject = await request(context.app)
      .get('/api/study/sessions')
      .query({ subjectId: first.body.id });
    expect(bySubject.body).toHaveLength(1);
    expect(bySubject.body[0].subjectName).toBe('React');

    const byPeriod = await request(context.app)
      .get('/api/study/sessions')
      .query({ from: '2026-04-04', to: '2026-04-10' });
    expect(byPeriod.body).toHaveLength(1);
    expect(byPeriod.body[0].subjectName).toBe('SQL');
  });

  it('atualiza os dados de um assunto de estudo', async () => {
    const subject = await request(context.app)
      .post('/api/study/subjects')
      .send({ name: 'TypeScript', technology: 'TS 5' });

    const response = await request(context.app)
      .patch(`/api/study/subjects/${subject.body.id}`)
      .send({ name: 'TypeScript avançado', technology: 'TS 6' });

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('TypeScript avançado');
    expect(response.body.technology).toBe('TS 6');
  });

  it('não permite renomear um assunto para um nome já usado', async () => {
    await request(context.app).post('/api/study/subjects').send({ name: 'React' });
    const other = await request(context.app).post('/api/study/subjects').send({ name: 'SQL' });

    const response = await request(context.app)
      .patch(`/api/study/subjects/${other.body.id}`)
      .send({ name: 'React' });

    expect(response.status).toBe(409);
    expect(response.body.error.message).toContain('Já existe');
  });

  it('atualiza uma sessão de estudo', async () => {
    const subject = await request(context.app).post('/api/study/subjects').send({ name: 'Rust' });
    const session = await request(context.app).post('/api/study/sessions').send({
      subjectId: subject.body.id,
      studiedOn: '2026-04-10',
      durationMinutes: 30,
    });

    const response = await request(context.app)
      .patch(`/api/study/sessions/${session.body.id}`)
      .send({ durationMinutes: 90, notes: 'Ownership e traits' });

    expect(response.status).toBe(200);
    expect(response.body.durationMinutes).toBe(90);
    expect(response.body.notes).toBe('Ownership e traits');
  });

  it('retorna 404 para assunto e sessão inexistentes', async () => {
    const subject = await request(context.app).get('/api/study/subjects/999');
    expect(subject.status).toBe(404);
    expect(subject.body.error.message).toBe('Assunto de estudo não encontrado.');

    const session = await request(context.app).patch('/api/study/sessions/999').send({ notes: 'x' });
    expect(session.status).toBe(404);
    expect(session.body.error.message).toBe('Sessão de estudo não encontrada.');
  });

  it('resume o tempo de estudo respeitando os filtros', async () => {
    const react = await request(context.app).post('/api/study/subjects').send({ name: 'React' });
    const sql = await request(context.app).post('/api/study/subjects').send({ name: 'SQL' });

    await request(context.app).post('/api/study/sessions').send({
      subjectId: react.body.id,
      studiedOn: '2026-04-01',
      durationMinutes: 30,
    });
    await request(context.app).post('/api/study/sessions').send({
      subjectId: sql.body.id,
      studiedOn: '2026-04-05',
      durationMinutes: 45,
    });

    const summary = await request(context.app).get('/api/study/summary');
    expect(summary.body.totalMinutes).toBe(75);
    expect(summary.body.totalSessions).toBe(2);
    expect(summary.body.averageSessionMinutes).toBe(38);
    expect(summary.body.subjectsCount).toBe(2);
    expect(summary.body.bySubject).toHaveLength(2);

    const filtered = await request(context.app)
      .get('/api/study/summary')
      .query({ subjectId: react.body.id });
    expect(filtered.body.totalMinutes).toBe(30);
    expect(filtered.body.totalSessions).toBe(1);
  });

  it('remove as atividades das sessões apagadas junto com o assunto', async () => {
    const subject = await request(context.app).post('/api/study/subjects').send({ name: 'Go' });
    await request(context.app).post('/api/study/sessions').send({
      subjectId: subject.body.id,
      studiedOn: '2026-04-10',
      durationMinutes: 30,
    });

    await request(context.app).delete(`/api/study/subjects/${subject.body.id}`);

    const orphanActivities = context.db
      .prepare(`SELECT * FROM activities WHERE entity_type = 'session'`)
      .all();
    expect(orphanActivities).toHaveLength(0);
  });

  it('remove um assunto e as sessões vinculadas', async () => {
    const subject = await request(context.app).post('/api/study/subjects').send({ name: 'Go' });
    await request(context.app).post('/api/study/sessions').send({
      subjectId: subject.body.id,
      studiedOn: '2026-04-10',
      durationMinutes: 30,
    });

    const response = await request(context.app).delete(`/api/study/subjects/${subject.body.id}`);
    expect(response.status).toBe(204);

    const sessions = await request(context.app).get('/api/study/sessions');
    expect(sessions.body).toHaveLength(0);
  });
});
