import type { Db } from './connection.js';
import { addDays, toISODate, todayISO } from '../lib/dates.js';

export interface SeedResult {
  seeded: boolean;
  message: string;
}

function dateFromToday(offsetDays: number): string {
  return toISODate(addDays(new Date(), offsetDays));
}

const PROJECTS = [
  {
    name: 'Portal de Clientes',
    description: 'Painel web para clientes acompanharem contratos, faturas e suporte.',
    category: 'Web',
    status: 'active',
    priority: 'high',
    color: '#6366f1',
    startOffset: -30,
    dueOffset: 20,
  },
  {
    name: 'API de Pagamentos',
    description: 'Serviço de conciliação e chargebacks integrado ao gateway.',
    category: 'Backend',
    status: 'active',
    priority: 'urgent',
    color: '#f59e0b',
    startOffset: -20,
    dueOffset: 7,
  },
  {
    name: 'Design System Internos',
    description: 'Padronização de componentes e tokens de design da equipe.',
    category: 'Frontend',
    status: 'planning',
    priority: 'medium',
    color: '#10b981',
    startOffset: 5,
    dueOffset: 40,
  },
  {
    name: 'Blog Técnico',
    description: 'Publicação quinzenal de artigos sobre engenharia de software.',
    category: 'Conteúdo',
    status: 'paused',
    priority: 'low',
    color: '#ec4899',
    startOffset: -60,
    dueOffset: 60,
  },
] as const;

const TASKS: Array<{
  title: string;
  description: string;
  projectIndex: number;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  dueOffset: number | null;
}> = [
  {
    title: 'Modelar schema de contratos',
    description: 'Definir tabelas de contratos, anexos e histórico de alterações.',
    projectIndex: 0,
    status: 'done',
    priority: 'high',
    category: 'Backend',
    dueOffset: -12,
  },
  {
    title: 'Tela de login com SSO',
    description: 'Integrar autenticação via OIDC com fallback local.',
    projectIndex: 0,
    status: 'done',
    priority: 'medium',
    category: 'Frontend',
    dueOffset: -6,
  },
  {
    title: 'Listagem de faturas com paginação',
    description: 'Paginação por cursor e filtros por status de pagamento.',
    projectIndex: 0,
    status: 'in_progress',
    priority: 'high',
    category: 'Frontend',
    dueOffset: 3,
  },
  {
    title: 'Exportar relatório em CSV',
    description: 'Gerar relatório de faturas do período direto no cliente.',
    projectIndex: 0,
    status: 'todo',
    priority: 'low',
    category: 'Frontend',
    dueOffset: 12,
  },
  {
    title: 'Job de conciliação diária',
    description: 'Processar arquivos do gateway e marcar divergências.',
    projectIndex: 1,
    status: 'in_progress',
    priority: 'urgent',
    category: 'Backend',
    dueOffset: -1,
  },
  {
    title: 'Idempotência nas requisições de cobrança',
    description: 'Evitar cobranças duplicadas em reprocessamentos.',
    projectIndex: 1,
    status: 'todo',
    priority: 'urgent',
    category: 'Backend',
    dueOffset: 2,
  },
  {
    title: 'Testes de integração do webhook',
    description: 'Cobrir cenários de duplicidade, atraso e assinatura inválida.',
    projectIndex: 1,
    status: 'todo',
    priority: 'high',
    category: 'QA',
    dueOffset: 5,
  },
  {
    title: 'Documentar endpoints da API',
    description: 'OpenAPI com exemplos de requisição e resposta.',
    projectIndex: 1,
    status: 'done',
    priority: 'medium',
    category: 'Documentação',
    dueOffset: -20,
  },
  {
    title: 'Tokens de cores e espaçamento',
    description: 'Definir escala base do design system.',
    projectIndex: 2,
    status: 'todo',
    priority: 'medium',
    category: 'Design',
    dueOffset: 25,
  },
  {
    title: 'Componente de botão acessível',
    description: 'Estados de foco, teclado e contraste AA.',
    projectIndex: 2,
    status: 'todo',
    priority: 'medium',
    category: 'Design',
    dueOffset: null,
  },
  {
    title: 'Revisar posts em rascunho',
    description: 'Revisar três artigos antes de agendar a publicação.',
    projectIndex: 3,
    status: 'todo',
    priority: 'low',
    category: 'Conteúdo',
    dueOffset: 35,
  },
  {
    title: 'Configurar pipeline de deploy',
    description: 'Build, testes e publicação automática do portal.',
    projectIndex: 0,
    status: 'done',
    priority: 'medium',
    category: 'Infra',
    dueOffset: -25,
  },
];

const SUBJECTS = [
  { name: 'TypeScript', technology: 'TypeScript 5', color: '#3178c6' },
  { name: 'React', technology: 'React 19', color: '#61dafb' },
  { name: 'Node.js & Express', technology: 'Node.js 24', color: '#3c873a' },
  { name: 'SQLite', technology: 'SQLite', color: '#e38c00' },
] as const;

const SESSIONS: Array<{ subjectIndex: number; dayOffset: number; durationMinutes: number; notes: string }> = [
  { subjectIndex: 0, dayOffset: -1, durationMinutes: 60, notes: 'Tipagem avançada e generics.' },
  { subjectIndex: 0, dayOffset: -3, durationMinutes: 45, notes: 'Utility types no dia a dia.' },
  { subjectIndex: 1, dayOffset: -2, durationMinutes: 90, notes: 'Suspense e data fetching.' },
  { subjectIndex: 1, dayOffset: -6, durationMinutes: 50, notes: 'Formulários controlados.' },
  { subjectIndex: 2, dayOffset: -4, durationMinutes: 75, notes: 'Middlewares e tratamento de erros.' },
  { subjectIndex: 2, dayOffset: -8, durationMinutes: 40, notes: 'Streams e performance.' },
  { subjectIndex: 3, dayOffset: -5, durationMinutes: 35, notes: 'Indices e planos de consulta.' },
  { subjectIndex: 0, dayOffset: -10, durationMinutes: 60, notes: 'Type guards reutilizáveis.' },
];

const GOALS = [
  {
    title: 'Entregar a API de Pagamentos',
    description: 'Concluir conciliação, idempotência e documentação.',
    scope: 'professional',
    progress: 70,
    status: 'active',
    dueOffset: 7,
  },
  {
    title: 'Estudar 100 horas de TypeScript',
    description: 'Sessões curtas e consistentes, 4x por semana.',
    scope: 'personal',
    progress: 45,
    status: 'active',
    dueOffset: 30,
  },
  {
    title: 'Publicar 4 artigos no blog',
    description: 'Um artigo por mês, revisados antes de publicar.',
    scope: 'personal',
    progress: 25,
    status: 'active',
    dueOffset: 45,
  },
  {
    title: 'Certificação de Node.js',
    description: 'Estudar para a certificação oficial.',
    scope: 'professional',
    progress: 10,
    status: 'active',
    dueOffset: 90,
  },
  {
    title: 'Configurar CI do DevTrack',
    description: 'Lint, testes e build automáticos no GitHub Actions.',
    scope: 'professional',
    progress: 100,
    status: 'completed',
    dueOffset: -15,
  },
] as const;

export function seedDemoData(db: Db): SeedResult {
  const existing = db.prepare(`SELECT COUNT(*) AS count FROM projects`).get() as { count: number };

  if (existing.count > 0) {
    return {
      seeded: false,
      message: 'O banco já contém dados. Os dados de demonstração não foram inseridos novamente.',
    };
  }

  const today = todayISO();

  const insertProject = db.prepare(
    `INSERT INTO projects (name, description, category, status, priority, color, start_date, due_date, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
  );

  const insertTask = db.prepare(
    `INSERT INTO tasks (title, description, project_id, status, priority, category, due_date, completed_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
  );

  const insertSubject = db.prepare(
    `INSERT INTO study_subjects (name, technology, color, created_at) VALUES (?, ?, ?, datetime('now'))`,
  );

  const insertSession = db.prepare(
    `INSERT INTO study_sessions (subject_id, studied_on, duration_minutes, notes, created_at)
     VALUES (?, ?, ?, ?, datetime('now'))`,
  );

  const insertGoal = db.prepare(
    `INSERT INTO goals (title, description, scope, progress, status, due_date, completed_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
  );

  const insertActivity = db.prepare(
    `INSERT INTO activities (type, title, description, entity_type, entity_id, created_at)
     VALUES (?, ?, ?, ?, ?, datetime('now', ?))`,
  );

  const run = db.transaction(() => {
    const projectIds: number[] = [];

    for (const project of PROJECTS) {
      const info = insertProject.run(
        project.name,
        project.description,
        project.category,
        project.status,
        project.priority,
        project.color,
        dateFromToday(project.startOffset),
        dateFromToday(project.dueOffset),
      );
      projectIds.push(Number(info.lastInsertRowid));
    }

    for (const task of TASKS) {
      const projectId = projectIds[task.projectIndex];
      const completedAt = task.status === 'done' ? `${dateFromToday(task.dueOffset ?? 0)} 09:00:00` : null;

      const info = insertTask.run(
        task.title,
        task.description,
        projectId,
        task.status,
        task.priority,
        task.category,
        task.dueOffset === null ? null : dateFromToday(task.dueOffset),
        completedAt,
      );

      if (task.status === 'done') {
        insertActivity.run(
          'task_completed',
          `Tarefa "${task.title}" concluída`,
          '',
          'task',
          Number(info.lastInsertRowid),
          `-${Math.abs(Math.min(task.dueOffset ?? 0, -1))} days`,
        );
      }
    }

    const subjectIds: number[] = [];

    for (const subject of SUBJECTS) {
      const info = insertSubject.run(subject.name, subject.technology, subject.color);
      subjectIds.push(Number(info.lastInsertRowid));
    }

    for (const session of SESSIONS) {
      insertSession.run(
        subjectIds[session.subjectIndex],
        dateFromToday(session.dayOffset),
        session.durationMinutes,
        session.notes,
      );
    }

    for (const goal of GOALS) {
      const completedAt = goal.status === 'completed' ? `${dateFromToday(goal.dueOffset)} 18:00:00` : null;

      insertGoal.run(
        goal.title,
        goal.description,
        goal.scope,
        goal.progress,
        goal.status,
        dateFromToday(goal.dueOffset),
        completedAt,
      );
    }

    insertActivity.run(
      'project_created',
      'Projeto "Portal de Clientes" criado',
      'Painel web para clientes acompanharem contratos, faturas e suporte.',
      'project',
      projectIds[0],
      '-30 days',
    );

    insertActivity.run(
      'goal_completed',
      'Meta "Configurar CI do DevTrack" concluída',
      '',
      'goal',
      null,
      '-15 days',
    );

    insertActivity.run(
      'study_session_logged',
      'Sessão de estudo registrada (60 min)',
      'TypeScript',
      'session',
      null,
      '-1 days',
    );
  });

  run();

  return {
    seeded: true,
    message: `Dados de demonstração inseridos em ${today}.`,
  };
}
